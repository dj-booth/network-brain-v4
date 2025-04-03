'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { ColumnOption } from '@/app/lib/columnStore';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './popover';
import { Button } from './button';

interface SingleSelectFieldProps {
  value: string | null;
  options: ColumnOption[];
  onChange: (value: string | null) => void;
  onAddOption?: (option: ColumnOption) => void;
  readOnly?: boolean;
}

export function SingleSelectField({
  value,
  options,
  onChange,
  onAddOption,
  readOnly = false
}: SingleSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  
  const selectedOption = options.find(opt => opt.value === value);
  
  const handleOptionSelect = (optionValue: string) => {
    onChange(value === optionValue ? null : optionValue);
    setIsOpen(false);
  };
  
  const handleAddOption = () => {
    if (newOptionText.trim() && onAddOption) {
      onAddOption({
        value: newOptionText.trim(),
        label: newOptionText.trim()
      });
      setNewOptionText('');
    }
  };
  
  const displayElement = selectedOption ? (
    <div
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-700 truncate max-w-full"
      style={{ backgroundColor: selectedOption.color }}
    >
      {selectedOption.label}
    </div>
  ) : (
    <div className="text-gray-400 text-sm">Select an option</div>
  );
  
  if (readOnly) {
    return displayElement;
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{displayElement}</div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-white">
        <div className="max-h-[200px] overflow-y-auto p-1">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleOptionSelect(option.value)}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: option.color }}
              />
              <span className="flex-grow truncate">{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </div>
          ))}
        </div>
        
        {onAddOption && (
          <div className="border-t p-1">
            <div className="flex items-center px-2 py-1.5">
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Add new option..."
                className="flex-grow text-sm px-2 py-1 border rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddOption();
                  }
                }}
              />
              <Button
                onClick={handleAddOption}
                disabled={!newOptionText.trim()}
                size="sm"
                className="ml-1 px-2 h-7"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 