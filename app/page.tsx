'use client'; // Convert to Client Component for state and interaction

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Use client component client
import { ProfileGrid } from './components/ProfileGrid';
import { Database } from '@/types/supabase'; // Import Database type
import { LoadingState } from './components/LoadingState'; // Import a loading state component

type Profile = Database['public']['Tables']['profiles']['Row'];
type FilterableColumn = keyof Profile; // Or a subset if needed

// Define which columns are filterable (adjust as needed)
const FILTERABLE_COLUMNS: FilterableColumn[] = [
  'full_name', 
  'email',
  'location',
  'referral_source', 
  'startup_name',
  'skillset'
  // Add other text-based fields you want to filter by
];

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterColumn, setFilterColumn] = useState<FilterableColumn>(FILTERABLE_COLUMNS[0]); // Default to first column
  const [filterValue, setFilterValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]); // State for suggestions
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false); // State for dropdown visibility
  const inputRef = useRef<HTMLInputElement>(null); // Ref for input field
  const suggestionsRef = useRef<HTMLUListElement>(null); // Ref for suggestions list

  const supabase = createClientComponentClient<Database>(); // Create client-side Supabase client

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('credibility_score', { ascending: false });

      if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        setError('Failed to load profiles.');
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }
      setIsLoading(false);
    };

    fetchProfiles();
  }, [supabase]); // Re-fetch if supabase client instance changes (though unlikely)

  // --- Calculate Suggestions --- 
  useEffect(() => {
    if (filterValue.length > 0) {
      const lowerCaseFilter = filterValue.toLowerCase();
      const uniqueValues = new Set<string>();
      
      profiles.forEach(profile => {
        const value = profile[filterColumn];
        if (typeof value === 'string' && value.toLowerCase().includes(lowerCaseFilter)) {
          uniqueValues.add(value); // Add the original case value
        }
      });
      
      // Limit suggestions (e.g., to top 10)
      const limitedSuggestions = Array.from(uniqueValues).slice(0, 10);
      setSuggestions(limitedSuggestions);
      setShowSuggestions(limitedSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filterValue, filterColumn, profiles]);

  // Memoize filtered profiles to avoid recalculation on every render
  const filteredProfiles = useMemo(() => {
    if (!filterValue) {
      return profiles; // No filter applied
    }
    const lowerCaseFilterValue = filterValue.toLowerCase();
    
    return profiles.filter(profile => {
      const columnValue = profile[filterColumn];
      // Simple case-insensitive text filtering
      // Extend this logic for more complex filtering (dates, numbers, etc.) if needed
      return typeof columnValue === 'string' && columnValue.toLowerCase().includes(lowerCaseFilterValue);
    });
  }, [profiles, filterColumn, filterValue]);

  // --- Event Handlers --- 
  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilterValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
     return <LoadingState />; // Show loading state
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen">
      {/* Filter Controls */}
      <div className="bg-white p-4 mb-6 shadow-sm border-b border-gray-200">
        <div className="container mx-auto flex items-center space-x-4 relative">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value as FilterableColumn)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {FILTERABLE_COLUMNS.map(col => (
              <option key={col} value={col}>{col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option> // Format column name
            ))}
          </select>
          <div className="relative">
            <input 
              ref={inputRef}
              type="text"
              placeholder={`Filter ${filterColumn.replace(/_/g, ' ')}...`}
              value={filterValue}
              onChange={handleFilterValueChange}
              onFocus={() => filterValue && suggestions.length > 0 && setShowSuggestions(true)}
              className="block w-64 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul 
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg"
              >
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ProfileGrid profiles={filteredProfiles} />
    </main>
  );
}

// Remove the server-side getProfiles and dynamic export as data fetching is now client-side
// async function getProfiles() { ... } 
// export const dynamic = 'force-dynamic'; 