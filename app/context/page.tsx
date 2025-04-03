'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Profile, ProfileSchema } from '@/app/types/profile';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { AudioRecorder } from '@/app/components/AudioRecorder';

export default function ContextPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Focus search input on page load
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounce search to prevent too many requests
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchProfiles(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchProfiles = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(10);
        
      if (searchError) {
        throw searchError;
      }
      
      setSearchResults(data || []);
      
      // If no results, show create option
      if (data && data.length === 0) {
        setNewProfileName(query);
        setShowCreateForm(true);
      } else {
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error("Error searching profiles:", err);
      setError("Failed to search profiles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleRecordingComplete = () => {
    // Optionally refresh the profile data or show a success message
  };

  const createNewProfile = async () => {
    if (!newProfileName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newProfileId = uuidv4();
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: newProfileId,
          full_name: newProfileName,
          email: '',
          phone: '',
          linkedin: '',
          location: '',
          referral_source: 'Manual entry',
          credibility_score: 5.000, // Default middle score
          submitted_at: new Date().toISOString(),
        });
        
      if (createError) {
        throw createError;
      }
      
      // Navigate to the new profile page
      router.push(`/profiles/${newProfileId}`);
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("Failed to create new profile. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Context</h1>
      
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isLoading && (
            <div className="absolute right-3 top-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Results</h2>
          <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
            {searchResults.map((profile) => (
              <div 
                key={profile.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => handleProfileSelect(profile.id)}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{profile.full_name}</h3>
                  {profile.email && <p className="text-sm text-gray-500">{profile.email}</p>}
                </div>
                <div className="text-sm bg-gray-100 py-1 px-3 rounded-full">
                  Score: {Number(profile.credibility_score).toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Audio Recorder */}
      {selectedProfileId && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Record Voice Note</h2>
          <p className="text-gray-600 mb-6">
            Click the microphone to start recording a voice note for this profile.
          </p>
          <AudioRecorder 
            profileId={selectedProfileId}
            onRecordingComplete={handleRecordingComplete}
          />
        </div>
      )}
      
      {/* Create New Profile Form */}
      {showCreateForm && searchQuery.trim() && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Create New Profile</h2>
          <p className="text-gray-600 mb-4">
            No profile found for "{newProfileName}". Would you like to create a new profile?
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={createNewProfile}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions when no search query */}
      {!searchQuery.trim() && !isLoading && (
        <div className="text-center text-gray-500 py-10">
          <p>Enter a name to search for existing profiles or create a new one.</p>
        </div>
      )}
    </div>
  );
} 