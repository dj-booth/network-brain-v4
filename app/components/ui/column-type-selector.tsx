'use client';

import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './dropdown-menu';
import { ChevronDown, Type, ListFilter, Tags } from 'lucide-react';

export type ColumnType = 'text' | 'single-select' | 'multi-select';

interface ColumnTypeSelectorProps {
  currentType: ColumnType;
  onTypeChange: (type: ColumnType) => void;
  columnId: string;
}

export function ColumnTypeSelector({ 
  currentType, 
  onTypeChange, 
  columnId 
}: ColumnTypeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ml-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronDown className="h-3 w-3 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-white">
        <div className="px-2 py-1.5 text-sm font-semibold">
          Column Type: {columnId.replace(/_/g, ' ')}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer ${currentType === 'text' ? 'bg-blue-50' : ''}`}
          onClick={() => onTypeChange('text')}
        >
          <Type className="mr-2 h-4 w-4" />
          <div>
            <div>Text</div>
            <div className="text-xs text-gray-500">Plain text field</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer ${currentType === 'single-select' ? 'bg-blue-50' : ''}`}
          onClick={() => onTypeChange('single-select')}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          <div>
            <div>Single Select</div>
            <div className="text-xs text-gray-500">Choose one option</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer ${currentType === 'multi-select' ? 'bg-blue-50' : ''}`}
          onClick={() => onTypeChange('multi-select')}
        >
          <Tags className="mr-2 h-4 w-4" />
          <div>
            <div>Multi Select</div>
            <div className="text-xs text-gray-500">Choose multiple options</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 