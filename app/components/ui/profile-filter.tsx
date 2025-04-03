'use client'

import React, { useState } from 'react'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Filter, X, Check } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row'];
type FilterableProperty = keyof Profile;

interface ProfileFilterProps {
  profiles: Profile[];
  onFilterChange: (filtered: Profile[]) => void;
}

interface FilterCondition {
  property: FilterableProperty;
  value: string;
}

export function ProfileFilter({ profiles, onFilterChange }: ProfileFilterProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [property, setProperty] = useState<FilterableProperty | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);

  // Define filterable properties
  const filterableProperties: FilterableProperty[] = [
    'full_name',
    'email',
    'linkedin',
    'location',
    'startup_name',
    'summary',
    'referral_source',
  ];

  // Apply filters to profiles
  const applyFilters = () => {
    if (activeFilters.length === 0) {
      onFilterChange(profiles);
      return;
    }

    const filtered = profiles.filter(profile => {
      return activeFilters.every(filter => {
        const profileValue = profile[filter.property];
        if (profileValue === null || profileValue === undefined) return false;
        return String(profileValue).toLowerCase().includes(filter.value.toLowerCase());
      });
    });

    onFilterChange(filtered);
  };

  // Add a new filter
  const addFilter = () => {
    if (!property || !value.trim()) return;
    
    const newFilter: FilterCondition = {
      property,
      value: value.trim()
    };
    
    // Avoid duplicates
    const filterExists = activeFilters.some(
      filter => filter.property === property && filter.value === value.trim()
    );
    
    if (!filterExists) {
      const newFilters = [...activeFilters, newFilter];
      setActiveFilters(newFilters);
      setValue('');
      
      // Apply the new filters
      setTimeout(() => {
        applyFilters();
      }, 0);
    }
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    setActiveFilters(newFilters);
    
    // Re-apply the remaining filters
    setTimeout(() => {
      if (newFilters.length === 0) {
        onFilterChange(profiles);
      } else {
        applyFilters();
      }
    }, 0);
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    onFilterChange(profiles);
  };

  // Format property name for display
  const formatPropertyName = (property: string): string => {
    return property
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex gap-2 items-center">
      <Popover
        open={open}
        onOpenChange={async (value) => {
          setOpen(value);
          if (!value) setTimeout(() => setProperty(undefined), 100);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-8', activeFilters.length > 0 && 'w-fit !px-2')}
          >
            {activeFilters.length > 0 ? (
              <div className="flex items-center gap-1 text-xs">
                <X
                  className="h-3.5 w-3.5"
                  onClick={(e: React.MouseEvent<SVGElement, MouseEvent>) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                />
                <span className="whitespace-nowrap">
                  {activeFilters.length} active filter
                  {activeFilters.length > 1 ? 's' : ''}
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
              {filterableProperties.map((prop) => (
                <div
                  key={prop}
                  className={cn(
                    'flex items-center rounded-sm px-2 py-1.5 hover:bg-gray-100 cursor-pointer',
                    {
                      'bg-gray-100': property === prop,
                    }
                  )}
                  onClick={() => {
                    setProperty(prop);
                    setValue('');
                  }}
                >
                  <div className="flex-1">
                    {formatPropertyName(prop)}
                  </div>
                  {activeFilters.some(filter => filter.property === prop) && (
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
                  <div className="flex gap-2">
                    <input
                      id="filter-value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addFilter();
                        }
                      }}
                      className="rounded-md border px-3 py-2 text-sm flex-1"
                      placeholder="Filter value..."
                    />
                    <Button 
                      onClick={addFilter}
                      size="sm"
                      disabled={!value.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeFilters.length > 0 && (
              <div className="p-2 border-t mt-2">
                <h4 className="font-medium text-sm mb-2">Active filters</h4>
                <div className="flex flex-wrap gap-1">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
                    >
                      <span className="font-medium">{formatPropertyName(filter.property)}:</span>
                      <span>{filter.value}</span>
                      <X
                        className="h-3 w-3 cursor-pointer ml-1"
                        onClick={() => removeFilter(index)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 