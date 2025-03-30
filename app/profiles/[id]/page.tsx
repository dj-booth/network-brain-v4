import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
// import type { Profile } from '../../types/profile'; // Remove old type
import { Database } from '@/types/supabase'; // Use generated types
import { ProfileDetail } from '../../components/ProfileDetail'; // Adjust path if needed

// Define types based on generated schema
type ProfileWithEmbeddings = Database['public']['Tables']['profiles']['Row'] & {
  embeddings: Database['public']['Tables']['embeddings']['Row'][];
};
type Embedding = Database['public']['Tables']['embeddings']['Row'];

// Configure route segment
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfilePageProps {
  params: {
    id: string;
  };
}

// Update function return type
async function getProfile(id: string): Promise<ProfileWithEmbeddings | null> {
  const supabase = createServerComponentClient<Database>({ cookies }); // Add DB type to client
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        embeddings (
          id,
          type,
          content,
          is_edited_by_admin,
          last_edited_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    // Explicitly cast the result to ensure type correctness
    return profile as ProfileWithEmbeddings;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pass the profile object which now includes embeddings */}
      <ProfileDetail profile={profile} />
    </div>
  );
} 