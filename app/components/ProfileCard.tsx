'use client';

import React from 'react';
import Link from 'next/link';
import type { Profile } from '../types/profile';

interface ProfileCardProps {
  profile: Profile;
  onRetry?: () => void;
}

export function ProfileCard({ profile, onRetry }: ProfileCardProps) {
  return (
    <Link href={`/profiles/${profile.id}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-gray-600">{profile.startup_name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Credibility</div>
            <div className="text-lg font-semibold text-blue-600">{profile.credibility_score}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Location</div>
            <div className="text-gray-900">{profile.location}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="text-gray-900">{profile.current_plan}</div>
          </div>
        </div>

        {!profile.last_scraped_at && onRetry && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onRetry();
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry Scraping
          </button>
        )}
      </div>
    </Link>
  );
} 