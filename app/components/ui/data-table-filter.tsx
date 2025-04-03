'use client'

import { Table } from '@tanstack/react-table'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useState } from 'react'
import { cn } from '@/app/lib/utils'
import { X, Filter, Check } from 'lucide-react'

// Simplified version of the data-table-filter component
export function DataTableFilter<TData>({
  table,
}: {
  table: Table<TData>
}) {
  return (
    <div className="flex gap-2 items-center">
      <TableFilter table={table} />
      <TableFilterActions table={table} />
    </div>
  )
}

export function TableFilterActions<TData>({ table }: { table: Table<TData> }) {
  const hasFilters = table.getState().columnFilters.length > 0

  function clearFilters() {
    table.setColumnFilters([])
    table.setGlobalFilter('')
  }

  return (
    <Button
      className={cn('h-8 px-2', !hasFilters && 'hidden')}
      variant="destructive"
      onClick={clearFilters}
    >
      <X className="h-4 w-4 mr-2" />
      Clear
    </Button>
  )
}

export function TableFilter<TData>({ table }: { table: Table<TData> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [property, setProperty] = useState<string | undefined>(undefined)
  
  const properties = table
    .getAllColumns()
    .filter((column) => column.getCanFilter())

  const hasFilters = table.getState().columnFilters.length > 0

  return (
    <Popover
      open={open}
      onOpenChange={async (value) => {
        setOpen(value)
        if (!value) setTimeout(() => setProperty(undefined), 100)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8', hasFilters && 'w-fit !px-2')}
        >
          {hasFilters ? (
            <div className="flex items-center gap-1 text-xs">
              <X
                className="h-3.5 w-3.5"
                onClick={(e: React.MouseEvent<SVGElement, MouseEvent>) => {
                  e.stopPropagation()
                  table.setColumnFilters([])
                  table.setGlobalFilter('')
                }}
              />
              <span className="whitespace-nowrap">
                {table.getState().columnFilters.length} active filter
                {table.getState().columnFilters.length > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-2 bg-white border shadow-md"
      >
        <div className="flex flex-col gap-2">
          <div className="space-y-1 p-2">
            <h4 className="font-medium leading-none">Filter by property</h4>
            <p className="text-sm text-muted-foreground">
              Select a property to filter on
            </p>
          </div>
          
          <div className="max-h-[200px] overflow-auto">
            {properties.map((column) => (
              <div
                key={column.id}
                className={cn(
                  'flex items-center rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  {
                    'bg-accent': property === column.id,
                  }
                )}
                onClick={() => {
                  setProperty(column.id)
                  const filterValue = column.getFilterValue()
                  setValue(filterValue ? String(filterValue) : '')
                }}
              >
                <div className="flex-1">
                  {column.id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
                {table.getState().columnFilters.some((filter) => filter.id === column.id) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))}
          </div>
            
          {property && (
            <div className="p-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="filter-value" className="text-sm font-medium">
                  Value
                </label>
                <input
                  id="filter-value"
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(e.target.value)
                    if (property) {
                      table.getColumn(property)?.setFilterValue(e.target.value)
                    }
                  }}
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="Filter value..."
                />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 