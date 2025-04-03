'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Linkedin, ExternalLink } from 'lucide-react';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileCardCompactProps {
  profile: Profile;
}

export function ProfileCardCompact({ profile }: ProfileCardCompactProps) {
  const summary = profile.summary || 'No summary available.';
  const truncatedSummary = summary.length > 250 
    ? `${summary.substring(0, 250)}...` 
    : summary;

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full transition-shadow hover:shadow-md">
      <div className="flex items-start space-x-3">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {profile.profile_picture_url ? (
            <Image 
              src={profile.profile_picture_url}
              alt={`${profile.full_name} profile picture`}
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-profile.png'; }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name and Actions */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <Link href={`/profiles/${profile.id}`} className="text-lg font-medium text-gray-900 hover:text-blue-600">
              {profile.full_name}
            </Link>
            
            <div className="flex space-x-2">
              {profile.linkedin && (
                <a 
                  href={profile.linkedin.toString().startsWith('http') ? profile.linkedin.toString() : `https://${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0A66C2] hover:text-opacity-80"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={18} />
                </a>
              )}
              
              <Link 
                href={`/intros?ids=${profile.id}`}
                className="text-blue-600 hover:text-blue-800"
                title="Send intro email"
              >
                <Mail size={18} />
              </Link>
              
              <Link 
                href={`/profiles/${profile.id}`}
                className="text-gray-500 hover:text-gray-700"
                title="View full profile"
              >
                <ExternalLink size={18} />
              </Link>
            </div>
          </div>
          
          {profile.startup_name && (
            <p className="text-sm text-gray-600 mt-0.5">
              {profile.startup_name}
            </p>
          )}
        </div>
      </div>
      
      {/* Summary */}
      <div className="mt-3 flex-grow">
        <p className="text-sm text-gray-700">
          {truncatedSummary}
        </p>
      </div>
    </div>
  );
} 