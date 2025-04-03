'use client'; // Convert to Client Component for state and interaction

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Use client component client
import { Database } from '@/types/supabase'; // Import Database type
import { LoadingState } from './components/LoadingState'; // Import a loading state component
import { DataTable } from './components/DataTable';
import { columns } from './components/columns';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return <LoadingState />; // Show loading state
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[rgb(66,66,69)]">Directory</h2>
        <p className="text-gray-600 mb-4">
          Browse and manage all profiles in the network.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <DataTable data={profiles} columns={columns} />
      </div>
    </div>
  );
}

// Remove the server-side getProfiles and dynamic export as data fetching is now client-side
// async function getProfiles() { ... } 
// export const dynamic = 'force-dynamic'; 