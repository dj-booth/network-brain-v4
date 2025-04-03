'use client';

import React from 'react';
import { ProfileCardCompact } from './ProfileCardCompact';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileViewProps {
  profiles: Profile[];
}

export function ProfileView({ profiles }: ProfileViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <ProfileCardCompact key={profile.id} profile={profile} />
        ))}
      </div>
      
      {profiles.length === 0 && (
        <div className="bg-white p-6 text-center rounded-lg border border-gray-200">
          <p className="text-gray-500">No profiles found.</p>
        </div>
      )}
    </div>
  );
} 