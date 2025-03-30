'use client';

import React from 'react';
import { ProfileCard } from './ProfileCard';
// import type { Profile } from '../types/profile'; // Remove old import
import { Database } from '@/types/supabase'; // Import Supabase types

type Profile = Database['public']['Tables']['profiles']['Row']; // Define Profile type from DB

interface ProfileGridProps {
  profiles: Profile[]; // Use the correct type
  onRetry?: (profileId: string) => void;
}

export function ProfileGrid({ profiles, onRetry }: ProfileGridProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Network Brain v4</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onRetry={() => onRetry?.(profile.id)}
          />
        ))}
      </div>
    </div>
  );
} 