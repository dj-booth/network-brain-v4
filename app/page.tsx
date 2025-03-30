import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ProfileGrid } from './components/ProfileGrid';

async function getProfiles() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('credibility_score', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return profiles;
}

export default async function HomePage() {
  const profiles = await getProfiles();

  return (
    <main className="min-h-screen bg-gray-50">
      <ProfileGrid profiles={profiles} />
    </main>
  );
} 