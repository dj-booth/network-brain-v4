'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next Image for optimization
import { Database } from '@/types/supabase'; // Use main Supabase types
import { ImageUploadModal } from './ImageUploadModal';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardProps {
  profile: Profile;
  onImageUpload?: (file: File) => Promise<void>;
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

export function ProfileCard({ profile, onImageUpload }: ProfileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const locationParts = profile.location?.split(',').map(part => part.trim()).filter(part => part) || [];

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (onImageUpload) {
      await onImageUpload(file);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Link href={`/profiles/${profile.id}`}>
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 flex flex-col h-full">
          
          <div className="flex items-start mb-4">
            {/* Profile Picture */}
            <div 
              className="mr-4 flex-shrink-0 cursor-pointer"
              onClick={handleImageClick}
            >
              {profile.profile_picture_url ? (
                <Image 
                  src={profile.profile_picture_url}
                  alt={`${profile.full_name} profile picture`}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-16 h-16 border hover:opacity-80 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-profile.png'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border hover:bg-gray-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="flex-grow">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{profile.full_name}</h2>
              <p className="text-gray-600 truncate">{profile.startup_name || 'No company listed'}</p>
            </div>
          </div>

          {/* Location Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {locationParts.length > 0 ? locationParts.map((part, index) => (
                <span 
                  key={index} 
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-700"
                  style={{ backgroundColor: stringToHslColor(part, 70, 88) }}
                >
                  {part}
                </span>
              )) : <span className="text-gray-500 text-sm">Location not specified</span>}
            </div>
          </div>

          {/* Summary (Truncated) */}
          <div className="flex-grow">
            <p className="text-gray-800 text-sm line-clamp-3">
              {profile.summary || 'No summary available.'}
            </p>
          </div>
        </div>
      </Link>

      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleImageUpload}
      />
    </>
  );
} 