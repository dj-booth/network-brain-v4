'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '../types/profile';

interface SuggestedIntroduction {
  profile: Profile;
  matchReason: string;
  matchScore: number;
}

interface SuggestedIntroductionsProps {
  suggestions: SuggestedIntroduction[];
  onIntroduceClick: (profile: Profile) => void;
}

export function SuggestedIntroductions({ suggestions, onIntroduceClick }: SuggestedIntroductionsProps) {
  const router = useRouter();

  if (!suggestions.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No suggested introductions available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.profile.id}
          className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
        >
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">
              {suggestion.profile.full_name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {suggestion.profile.startup_name}
            </p>
            <p className="mt-3 text-sm text-gray-700">
              {suggestion.matchReason}
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Math.round(suggestion.matchScore * 100)}% Match
              </span>
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <button
              onClick={() => onIntroduceClick(suggestion.profile)}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Introduce
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 