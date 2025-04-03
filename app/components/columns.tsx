'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Database } from '@/types/supabase'
import Link from 'next/link'
import { Checkbox } from './ui/checkbox'
import { ColumnTypeSelector, ColumnType } from './ui/column-type-selector'
import { useColumnStore } from '@/app/lib/columnStore'
import { SingleSelectField } from './ui/single-select-field'
import { MultiSelectField } from './ui/multi-select-field'

type Profile = Database['public']['Tables']['profiles']['Row']

function TableHeader({ column }: { column: any }) {
  const columnId = column.id;
  const columnConfig = useColumnStore(state => state.getColumnConfig(columnId));
  const setColumnType = useColumnStore(state => state.setColumnType);
  
  const handleTypeChange = (type: ColumnType) => {
    setColumnType(columnId, type);
  };

  return (
    <div className="flex items-center group">
      <span className="capitalize">{columnId.replace(/_/g, ' ')}</span>
      <ColumnTypeSelector 
        columnId={columnId} 
        currentType={columnConfig.type} 
        onTypeChange={handleTypeChange}
      />
    </div>
  );
}

function TableCell({ 
  value, 
  row, 
  column,
  table
}: { 
  value: any, 
  row: any, 
  column: any,
  table: any
}) {
  const columnId = column.id;
  const columnConfig = useColumnStore(state => state.getColumnConfig(columnId));
  const columnOptions = useColumnStore(state => state.getColumnOptions(columnId));
  const addColumnOption = useColumnStore(state => state.addColumnOption);
  const profileId = row.original.id;
  
  // Get the updateData function from table.options.meta
  const updateData = table.options.meta?.updateData;
  
  // Handle updates to profile fields
  const updateProfileField = async (fieldValue: any) => {
    if (updateData) {
      updateData(profileId, columnId, fieldValue);
    } else {
      console.warn('updateData function not available');
    }
  };
  
  if (columnConfig.type === 'single-select') {
    return (
      <SingleSelectField
        value={value as string | null}
        options={columnOptions}
        onChange={(newValue) => updateProfileField(newValue)}
        onAddOption={(option) => addColumnOption(columnId, option)}
      />
    );
  }
  
  if (columnConfig.type === 'multi-select') {
    // Convert string value to array if needed (e.g., if stored as comma-separated)
    let values: string[] = [];
    if (Array.isArray(value)) {
      values = value;
    } else if (typeof value === 'string' && value) {
      values = value.split(',').map(v => v.trim());
    }
    
    return (
      <MultiSelectField
        values={values}
        options={columnOptions}
        onChange={(newValues) => updateProfileField(newValues.join(','))}
        onAddOption={(option) => addColumnOption(columnId, option)}
      />
    );
  }
  
  // Default text display
  return value || '—';
}

export const columns: ColumnDef<Profile>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: 'left',
    },
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <TableHeader column={column} />,
    cell: ({ row }) => {
      const id = row.getValue('id') as string
      return (
        <div className="truncate max-w-[100px]" title={id}>
          {id.substring(0, 8)}...
        </div>
      )
    },
    enableColumnFilter: false,
    enableHiding: false,
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => <TableHeader column={column} />,
    cell: ({ row, getValue }) => {
      const id = row.original.id
      const value = getValue() as string | null
      
      // Special handling for full_name to make it a link
      return (
        <Link href={`/profiles/${id}`} className="font-medium text-blue-600 hover:underline">
          {value || '—'}
        </Link>
      )
    },
    enableHiding: false,
  },
]

// Define additional columns dynamically
const additionalColumns: ColumnDef<Profile>[] = [
  'email',
  'phone',
  'linkedin',
  'location',
  'referral_source',
  'current_plan',
  'startup_name',
  'cofounders_context',
  'startup_differentiator',
  'startup_validation',
  'job_search_preferences',
  'inspiring_companies',
  'hypothetical_startup_idea',
  'timeline_to_start',
  'skillset',
  'skillset_extra',
  'additional_interests',
  'desired_introductions',
  'long_term_goal',
  'nomination',
  'new_start_behavior',
  'discomfort_trigger',
  'group_dynamics',
  'core_values',
  'motivation_type',
  'stress_response',
  'focus_area',
  'self_description',
  'decision_style',
  'failure_response',
].map(key => ({
  accessorKey: key,
  header: ({ column }) => <TableHeader column={column} />,
  cell: ({ getValue, row, column, table }) => {
    const value = getValue()
    return <TableCell value={value} row={row} column={column} table={table} />
  },
  enableHiding: true,
}));

// Add all additional columns to the main columns array
columns.push(...additionalColumns); 