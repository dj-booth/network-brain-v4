'use client';

/// <reference types="react" />
import React, { useEffect, useState } from 'react';
import type { Profile } from '../types/profile';

interface SuggestedProfile extends Profile {
  matchScore: number;
  matchReasons: string[];
}

interface SuggestedConnectionsProps {
  profileId: string;
}

export const SuggestedConnections: React.FC<SuggestedConnectionsProps> = ({ profileId }) => {
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/profiles/${profileId}/suggestions`);
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [profileId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-gray-500 text-center">
        No suggestions available at this time.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-1">{suggestion.full_name}</h3>
              <p className="text-gray-600">{suggestion.current_plan}</p>
              <p className="text-gray-500">{suggestion.location}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Match Score</div>
              <div className="text-lg font-semibold text-blue-600">
                {(suggestion.matchScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Why you should connect</h4>
            <ul className="list-disc list-inside space-y-1">
              {suggestion.matchReasons.map((reason, index) => (
                <li key={index} className="text-gray-700">{reason}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
              Introduce
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              View Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 