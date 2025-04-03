'use client'; // Convert to Client Component for state and interaction

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Use client component client
import { Database } from '@/types/supabase'; // Import Database type
import { LoadingState } from './components/LoadingState'; // Import a loading state component
import { DataTable } from './components/DataTable';
import { ProfileView } from './components/ProfileView';
import { columns } from './components/columns';
import { ToggleView, ViewMode } from './components/ui/toggle-view';
import { ProfileFilter } from './components/ui/profile-filter';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function HomePage() {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        setAllProfiles([]);
        setFilteredProfiles([]);
      } else {
        setAllProfiles(data || []);
        setFilteredProfiles(data || []);
      }
      setIsLoading(false);
    };

    fetchProfiles();
  }, [supabase]); // Re-fetch if supabase client instance changes (though unlikely)

  // Handle filter changes
  const handleFilterChange = (filtered: Profile[]) => {
    setFilteredProfiles(filtered);
  };

  if (isLoading) {
    return <LoadingState />; // Show loading state
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[rgb(66,66,69)]">Directory</h2>
          <div className="flex items-center gap-3">
            <ProfileFilter 
              profiles={allProfiles} 
              onFilterChange={handleFilterChange} 
            />
            <ToggleView currentView={viewMode} onChange={setViewMode} />
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Browse and manage all profiles in the network.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        {viewMode === 'grid' ? (
          <DataTable data={filteredProfiles} columns={columns} />
        ) : (
          <ProfileView profiles={filteredProfiles} />
        )}
      </div>
    </div>
  );
}

// Remove the server-side getProfiles and dynamic export as data fetching is now client-side
// async function getProfiles() { ... } 
// export const dynamic = 'force-dynamic'; 