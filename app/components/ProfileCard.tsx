'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next Image for optimization
import { Database } from '@/types/supabase'; // Use main Supabase types

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardProps {
  profile: Profile;
  onRetry?: () => void;
}

// Helper function to generate pastel colors based on string hash
// Simple hash function (adjust as needed for better distribution)
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export function ProfileCard({ profile, onRetry }: ProfileCardProps) {
  const locationParts = profile.location?.split(',').map(part => part.trim()).filter(part => part) || [];

  return (
    <Link href={`/profiles/${profile.id}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 flex flex-col h-full">
        
        <div className="flex items-start mb-4">
          {/* Profile Picture */}
          <div className="mr-4 flex-shrink-0">
            {profile.profile_picture_url ? (
              <Image 
                src={profile.profile_picture_url}
                alt={`${profile.full_name} profile picture`}
                width={64} // Specify desired width
                height={64} // Specify desired height
                className="rounded-full object-cover w-16 h-16 border" // Added border
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-profile.png'; }} // Basic fallback
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">
                {/* Placeholder Icon or Initials */} 
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
          </div>

          {/* Name & Title */}
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{profile.full_name}</h2>
            <p className="text-gray-600 truncate">{profile.startup_name || 'No startup listed'}</p>
          </div>

          {/* Credibility Score */}
          <div className="text-right ml-2 flex-shrink-0">
            <div className="text-sm text-gray-500">Credibility</div>
            <div className="text-lg font-semibold text-blue-600">{profile.credibility_score?.toFixed(3) ?? 'N/A'}</div>
          </div>
        </div>

        {/* Location Tags */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Location</div>
          <div className="flex flex-wrap gap-1">
            {locationParts.length > 0 ? locationParts.map((part, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-700"
                style={{ backgroundColor: stringToHslColor(part, 70, 88) }} // Use HSL for pastel shades
              >
                {part}
              </span>
            )) : <span className="text-gray-900 text-sm">Not specified</span>}
          </div>
        </div>

        {/* Current Plan */}
        <div className="mb-4 flex-grow">
          <div className="text-sm text-gray-500">Current Plan</div>
          <div className="text-gray-900 text-sm line-clamp-2">{profile.current_plan || 'Not specified'}</div>
        </div>

        {/* Summary (Truncated) */}
        <div className="mb-4">
           <div className="text-sm text-gray-500">Summary</div>
           <p className="text-gray-800 text-sm italic line-clamp-3"> {/* line-clamp-3 roughly corresponds to 250 chars depending on content */}
             {profile.summary ? (
                profile.summary.length > 250 ? `${profile.summary.substring(0, 250)}...` : profile.summary
             ) : (
                'No summary available.'
             )}
           </p>
        </div>

        {/* Retry Button (Conditional) */}
        {!profile.last_scraped_at && onRetry && (
          <div className="mt-auto pt-4 border-t border-gray-100"> {/* Push button to bottom */} 
            <button
              onClick={(e) => {
                e.preventDefault(); // Prevent link navigation
                e.stopPropagation(); // Prevent link navigation
                onRetry();
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Retry Scraping
            </button>
          </div>
        )}
      </div>
    </Link>
  );
} 