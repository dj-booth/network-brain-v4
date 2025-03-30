'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Database } from '@/types/supabase'; // Use Supabase types
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Remove imports no longer needed after refactor
// import { View, Text, TouchableOpacity, StyleSheet } from '../compatibility/web-components';
// import type { Profile as OldProfileType } from '../types/profile'; 
// import { SuggestedConnections } from './SuggestedConnections';

// Define types based on generated schema
type Profile = Database['public']['Tables']['profiles']['Row'];
type Embedding = Database['public']['Tables']['embeddings']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type EmbeddingUpsert = Database['public']['Tables']['embeddings']['Insert']; // Use Insert for upsert data

// Combine Profile with its Embeddings for the prop type
type ProfileWithEmbeddings = Profile & {
  embeddings: Embedding[];
};

interface ProfileDetailProps {
  profile: ProfileWithEmbeddings; // Expect profile with embeddings
}

// Helper to format field names
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Fields to exclude from profile editing AND rendering
const EXCLUDED_PROFILE_FIELDS: (keyof Profile)[] = [
  'id', 
  'profile_created_at', 
  'last_scraped_at', 
  'completed' // <-- Add 'completed' here
];

export const ProfileDetail: React.FC<ProfileDetailProps> = ({ profile: initialProfile }) => {
  const [editableProfile, setEditableProfile] = useState<Profile>(initialProfile);
  const [introSought, setIntroSought] = useState<string>('');
  const [reasonToIntroduce, setReasonToIntroduce] = useState<string>('');
  // Store original embedding IDs for upsert
  const [introSoughtEmbeddingId, setIntroSoughtEmbeddingId] = useState<string | null>(null);
  const [reasonToIntroduceEmbeddingId, setReasonToIntroduceEmbeddingId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showEmptyFields, setShowEmptyFields] = useState<boolean>(false); // State for toggling empty fields
  const supabase = createClientComponentClient<Database>();

  // Update local state if the initial profile prop changes
  useEffect(() => {
    // Separate profile fields from embeddings
    const { embeddings, ...profileData } = initialProfile;
    setEditableProfile(profileData);

    // Find initial content for intro sought and reason to introduce
    const sought = embeddings.find(e => e.type === 'intro_sought');
    const reason = embeddings.find(e => e.type === 'reason_to_introduce');
    
    setIntroSought(sought?.content || '');
    setIntroSoughtEmbeddingId(sought?.id || null);

    setReasonToIntroduce(reason?.content || '');
    setReasonToIntroduceEmbeddingId(reason?.id || null);

  }, [initialProfile]);

  // Handles changes for standard profile fields
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    // Handle checkbox for boolean/null fields
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }
    // Handle potential number conversion (add more specific checks if needed)
    if (type === 'number' && value !== '') {
       processedValue = parseFloat(value);
       if (isNaN(processedValue)) processedValue = null; // Handle invalid number input
    }
     // Handle empty strings -> null for optional fields if desired
    // if (processedValue === '') {
    //    processedValue = null;
    // }
    
    setEditableProfile(prev => ({ ...prev, [name]: processedValue }));
    setSaveStatus(''); // Clear status on edit
  };

  // Separate handlers for embedding textareas
  const handleIntroSoughtChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIntroSought(e.target.value);
    setSaveStatus('');
  };
  const handleReasonToIntroduceChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReasonToIntroduce(e.target.value);
    setSaveStatus('');
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setSaveStatus('Saving...');

    // 1. Prepare Profile Update Data
    const profileUpdateData: ProfileUpdate = {};
    for (const key in editableProfile) {
        if (Object.prototype.hasOwnProperty.call(editableProfile, key) && !EXCLUDED_PROFILE_FIELDS.includes(key as keyof Profile)) {
            (profileUpdateData as any)[key] = (editableProfile as any)[key];
        }
    }

    // 2. Prepare Embeddings Upsert Data
    const embeddingsToUpsert: EmbeddingUpsert[] = [];
    if (introSought || introSoughtEmbeddingId) { // Only upsert if there's content or an existing ID
        embeddingsToUpsert.push({
            id: introSoughtEmbeddingId || undefined, // Use existing ID or let DB generate one
            profile_id: editableProfile.id,
            type: 'intro_sought',
            content: introSought,
            is_edited_by_admin: true,
            last_edited_at: new Date().toISOString()
        });
    }
    if (reasonToIntroduce || reasonToIntroduceEmbeddingId) {
        embeddingsToUpsert.push({
            id: reasonToIntroduceEmbeddingId || undefined,
            profile_id: editableProfile.id,
            type: 'reason_to_introduce',
            content: reasonToIntroduce,
            is_edited_by_admin: true,
            last_edited_at: new Date().toISOString()
        });
    }

    // Perform updates concurrently
    const [profileResult, embeddingsResult] = await Promise.allSettled([
      // Update profile
      supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', editableProfile.id),
      // Upsert embeddings (only if there are any to upsert)
      embeddingsToUpsert.length > 0
        ? supabase.from('embeddings').upsert(embeddingsToUpsert, { onConflict: 'id' })
        : Promise.resolve({ error: null }) // Resolve immediately if nothing to upsert
    ]);

    let profileError = profileResult.status === 'rejected' ? profileResult.reason : profileResult.value.error;
    let embeddingsError = embeddingsResult.status === 'rejected' ? embeddingsResult.reason : embeddingsResult.value.error;

    if (profileError || embeddingsError) {
      console.error('Error saving profile/embeddings:', { profileError, embeddingsError });
      setSaveStatus(`Error: ${profileError?.message || ''} ${embeddingsError?.message || ''}`);
    } else {
      setSaveStatus('Profile and introductions updated successfully!');
      // Update embedding IDs in state in case new ones were created
      // This requires selecting the data back from the upsert, which adds complexity.
      // For now, we assume the upsert worked. A full refresh might be simpler.
    }
    setIsLoading(false);
  };

  // Separate keys based on whether they have data
  const allKeys = Object.keys(editableProfile) as (keyof Profile)[];
  const filledKeys = allKeys.filter(key => 
    !EXCLUDED_PROFILE_FIELDS.includes(key) && 
    editableProfile[key] !== null && 
    editableProfile[key] !== undefined && 
    String(editableProfile[key]).trim() !== ''
  );
  const emptyKeys = allKeys.filter(key => 
    !EXCLUDED_PROFILE_FIELDS.includes(key) && 
    (editableProfile[key] === null || 
     editableProfile[key] === undefined || 
     String(editableProfile[key]).trim() === '')
  );

  // Helper function to render a field
  const renderField = (fieldName: keyof Profile) => {
      const value = editableProfile[fieldName];
      const label = formatFieldName(fieldName);
      // Basic type detection - refine as needed for specific fields (date, select, etc.)
      const inputType = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'checkbox' : 'text'; 
      const isTextArea = typeof value === 'string' && (value.length > 100 || fieldName === 'summary'); // Make summary always textarea

      return (
        <div key={fieldName} className={isTextArea ? 'md:col-span-2' : ''}>
          <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          {isTextArea ? (
            <textarea
              id={fieldName}
              name={fieldName}
              rows={4}
              value={value || ''} 
              onChange={handleProfileChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : inputType === 'checkbox' ? (
            // Simple checkbox for boolean - consider select (Yes/No/Unknown) for nullable booleans
            <input
              type="checkbox"
              id={fieldName}
              name={fieldName}
              checked={!!value} 
              onChange={handleProfileChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          ) : (
            <input
              type={inputType === 'number' ? 'number' : 'text'}
              id={fieldName}
              name={fieldName}
              value={typeof value === 'string' || typeof value === 'number' ? value : ''} 
              onChange={handleProfileChange}
              step={fieldName === 'credibility_score' ? '0.001' : 'any'} 
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
        </div>
      );
  }

  return (
    <form onSubmit={handleSave} className="min-h-screen bg-gray-50 p-8">
      {/* Use space-y to create gap between cards */}
      <div className="max-w-4xl mx-auto space-y-8"> 
        
        {/* Card 1: Header + Profile Info */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header Section - Simplified */}
          <div className="flex items-center justify-between mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold">Edit Profile: {initialProfile.full_name}</h1>
            <button 
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && (
             <div className={`mb-4 p-3 rounded text-sm ${saveStatus.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
               {saveStatus}
             </div>
          )}

          {/* --- Profile Information Section --- */}
          <h2 className="text-xl font-semibold mb-4 border-t pt-6">Profile Information</h2>
          {/* Fields with Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
            {filledKeys.map(key => renderField(key))}
          </div>

          {/* Toggle & Empty Fields Area */}
          {emptyKeys.length > 0 && (
            <div className="mb-6"> {/* Adjusted margin slightly */}
               <button 
                 type="button" 
                 onClick={() => setShowEmptyFields(!showEmptyFields)}
                 className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-4"
               >
                 {showEmptyFields ? 'Hide' : 'Show'} Empty Fields ({emptyKeys.length})
               </button>

              {/* Conditionally Render Empty Fields */} 
              {showEmptyFields && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-fadeIn border-t pt-6">
                   {emptyKeys.map(key => renderField(key))}
                 </div>
               )}
             </div>
          )}
          {/* --- End Profile Information Section --- */}
        </div> {/* End Card 1 */} 

        {/* Card 2: Introductions */} 
        <div className="bg-white rounded-lg shadow-lg p-8"> 
          <h2 className="text-xl font-semibold mb-4">Introductions</h2>
          <div className="space-y-6">
             <div>
               <label htmlFor="intro_sought" className="block text-sm font-medium text-gray-700 mb-1">
                 Introductions This Person Would Like
               </label>
               <textarea
                 id="intro_sought"
                 name="intro_sought"
                 rows={4}
                 value={introSought}
                 onChange={handleIntroSoughtChange}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
               />
             </div>
             <div>
               <label htmlFor="reason_to_introduce" className="block text-sm font-medium text-gray-700 mb-1">
                 Reasons to Introduce Someone to This Person
               </label>
               <textarea
                 id="reason_to_introduce"
                 name="reason_to_introduce"
                 rows={4}
                 value={reasonToIntroduce}
                 onChange={handleReasonToIntroduceChange}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
               />
             </div>
          </div>
        </div> {/* End Card 2 */} 

      </div>
    </form>
  );
};

// Add basic fadeIn animation to globals.css if needed
/* 
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
*/ 