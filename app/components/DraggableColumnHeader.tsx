"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { flexRender, Header, Table } from '@tanstack/react-table'
import { GripVertical } from 'lucide-react'
import { TableHead } from './ui/table'

interface DraggableColumnHeaderProps<TData> {
  header: Header<TData, unknown>
  table: Table<TData>
}

export function DraggableColumnHeader<TData>({
  header,
  table
}: DraggableColumnHeaderProps<TData>) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: header.column.id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={style}
      className="relative"
    >
      <div className="flex items-center">
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
        
        {header.column.getCanSort() && (
          <span className="ml-2 h-4 w-4 cursor-grab touch-none text-gray-400 hover:text-gray-600"
                {...attributes}
                {...listeners}>
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </div>
    </TableHead>
  )
} 