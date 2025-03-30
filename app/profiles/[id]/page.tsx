import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Profile } from '../../types/profile';
import { ProfileDetail } from '../../components/ProfileDetail';

// Configure route segment
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfilePageProps {
  params: {
    id: string;
  };
}

async function getProfile(id: string): Promise<Profile | null> {
  const supabase = createServerComponentClient({ cookies });
  
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

    return profile;
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
      <ProfileDetail profile={profile} />
    </div>
  );
} 