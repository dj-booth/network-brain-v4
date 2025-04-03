'use client'

import React, { useState, useEffect } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
import { Database } from '@/types/supabase'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Columns, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useColumnStore } from '@/app/lib/columnStore'

type Profile = Database['public']['Tables']['profiles']['Row']

interface DataTableProps {
  data: Profile[]
  columns: ColumnDef<Profile>[]
}

export function DataTable({ data, columns }: DataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const supabase = createClientComponentClient<Database>()
  const getColumnConfig = useColumnStore(state => state.getColumnConfig)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    meta: {
      updateData: async (profileId: string, columnId: string, value: any) => {
        try {
          // Update the profile in Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ [columnId]: value })
            .eq('id', profileId)
            
          if (error) {
            console.error('Error updating profile:', error)
            return
          }
          
          console.log(`Updated ${columnId} for profile ${profileId} to:`, value)
        } catch (error) {
          console.error('Error in updateData:', error)
        }
      },
    },
  })
  
  // Hide ID column by default
  useEffect(() => {
    const idColumn = table.getColumn('id')
    if (idColumn) {
      idColumn.toggleVisibility(false)
    }
  }, [table])

  const hidableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide()
    )

  const allColumnsVisible = hidableColumns.every((column) => column.getIsVisible())
  const someColumnsVisible = hidableColumns.some((column) => column.getIsVisible())

  // Count selected rows
  const selectedRowCount = Object.keys(rowSelection).length
  const canMakeIntro = selectedRowCount === 2

  function toggleAllColumns(value: boolean) {
    hidableColumns.forEach(column => column.toggleVisibility(!!value))
  }

  function handleMakeIntro() {
    if (canMakeIntro) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map(row => row.original)
      
      // Navigate to the intros page with the selected profiles
      router.push(`/intros?ids=${selectedRows.map(row => row.id).join(',')}`)
    }
  }

  // Helper to determine if a cell is a select field
  const isSelectField = (columnId: string) => {
    const config = getColumnConfig(columnId)
    return config.type === 'single-select' || config.type === 'multi-select'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Columns className="h-4 w-4" />
                <span className="ml-2">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white">
              <DropdownMenuCheckboxItem
                checked={allColumnsVisible}
                onSelect={(e) => {
                  e.preventDefault()
                }}
                onCheckedChange={(value) => toggleAllColumns(!!value)}
                className="border-b mb-1"
              >
                {allColumnsVisible ? "Deselect All" : "Select All"}
              </DropdownMenuCheckboxItem>
              {hidableColumns.map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onSelect={(e) => {
                      e.preventDefault()
                    }}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Make Intro Button */}
        <Button 
          onClick={handleMakeIntro}
          disabled={!canMakeIntro}
          className={`${canMakeIntro ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} text-white`}
          title={canMakeIntro ? "Make introduction between selected profiles" : "Select two people to introduce"}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Make Intro
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="group">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  className={row.getIsSelected() ? 'bg-purple-100' : undefined}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={isSelectField(cell.column.id) ? 'p-2' : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 