'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Database } from '@/types/supabase'; // Use Supabase types
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { AudioRecorder } from './AudioRecorder';

// Define types based on generated schema
type Profile = Database['public']['Tables']['profiles']['Row'];
type Embedding = Database['public']['Tables']['embeddings']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type EmbeddingUpsert = Database['public']['Tables']['embeddings']['Insert']; // Use Insert for upsert data
type ProfileNote = Database['public']['Tables']['profile_notes']['Row']; // Use the proper type from Supabase

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

// Only these fields will be shown in view mode
const PRIMARY_FIELDS: (keyof Profile)[] = [
  'full_name',
  'summary',
  'startup_name',
  'location',
  'linkedin',
  'email',
  'phone',
  'credibility_score'
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
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // New state for edit mode
  const [notes, setNotes] = useState<ProfileNote[]>([]); // State for profile notes
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(true);
  
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

  // Fetch notes when the component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoadingNotes(true);
        
        // Fetch profile notes from Supabase
        const { data, error } = await supabase
          .from('profile_notes')
          .select('*')
          .eq('profile_id', initialProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        console.log('Fetched notes:', data);
        setNotes(data || []);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [initialProfile.id, supabase]);

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
      setIsEditMode(false); // Exit edit mode after successful save
    }
    setIsLoading(false);
  };

  // Handle note recording complete - refresh notes list
  const handleRecordingComplete = async () => {
    try {
      // Refresh notes from Supabase
      const { data, error } = await supabase
        .from('profile_notes')
        .select('*')
        .eq('profile_id', initialProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setNotes(data || []);
    } catch (err) {
      console.error('Error refreshing notes:', err);
    }
  };

  // Format date for notes display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to render a field in view mode
  const renderViewField = (fieldName: keyof Profile) => {
    const value = editableProfile[fieldName];
    
    if (!value && fieldName !== 'credibility_score') return null;
    
    // Special case for LinkedIn field - render with logo
    if (fieldName === 'linkedin' && value) {
      return (
        <div key={fieldName} className="flex items-center space-x-2">
          <svg 
            className="h-5 w-5 text-[#0077b5]" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
          </svg>
          <Link 
            href={value.toString().startsWith('http') ? value.toString() : `https://${value}`} 
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            {value.toString()}
          </Link>
        </div>
      );
    }
    
    // Special case for credibility score - render as prominent display
    if (fieldName === 'credibility_score') {
      return (
        <div key={fieldName} className="absolute top-6 right-6 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 text-center">
          <div className="text-sm text-gray-500 font-medium">Credibility</div>
          <div className="text-xl font-bold text-yellow-600">
            {value !== null ? Number(value).toFixed(3) : '0.000'}
          </div>
        </div>
      );
    }
    
    // Default rendering
    return (
      <div key={fieldName} className="mb-4">
        {fieldName === 'full_name' ? (
          <h1 className="text-3xl font-bold text-gray-900">{value}</h1>
        ) : fieldName === 'summary' ? (
          <div className="mt-3 text-base text-gray-700">{value}</div>
        ) : fieldName === 'startup_name' ? (
          <div className="text-lg font-medium text-gray-900">{value}</div>
        ) : fieldName === 'location' ? (
          <div className="text-gray-600">{value}</div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{formatFieldName(fieldName)}:</span>
            <span className="text-gray-900">{String(value)}</span>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render a field in edit mode
  const renderEditField = (fieldName: keyof Profile) => {
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
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSaveStatus('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <form onSubmit={handleSave}>
        {/* LinkedIn-style Profile Header */}
        <div className="bg-white shadow">
          {/* Cover image */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-blue-100 to-blue-50 relative">
            {/* Edit mode toggle */}
            <button
              type="button"
              onClick={toggleEditMode}
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow hover:bg-gray-50 z-10"
            >
              {isEditMode ? (
                <CheckIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <PencilIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {/* Profile picture */}
            <div className="absolute -bottom-12 left-8 border-4 border-white rounded-full shadow-md overflow-hidden">
              {editableProfile.profile_picture_url ? (
                <Image 
                  src={editableProfile.profile_picture_url}
                  alt={`${editableProfile.full_name} profile picture`}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-16 px-8 pb-8 relative">
            {/* Save status message */}
            {saveStatus && (
              <div className={`mb-4 p-3 rounded text-sm ${saveStatus.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {saveStatus}
              </div>
            )}
            
            {isEditMode ? (
              /* Edit Mode */
              <div>
                <div className="mb-6">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                  {PRIMARY_FIELDS.map(key => renderEditField(key))}
                  
                  {/* Toggle for additional fields */}
                  <div className="md:col-span-2 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowEmptyFields(!showEmptyFields)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {showEmptyFields ? 'Hide' : 'Show'} Additional Fields
                    </button>
                    
                    {/* Additional fields in edit mode */}
                    {showEmptyFields && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4 pt-4 border-t">
                        {Object.keys(editableProfile)
                          .filter(key => 
                            !EXCLUDED_PROFILE_FIELDS.includes(key as keyof Profile) && 
                            !PRIMARY_FIELDS.includes(key as keyof Profile)
                          )
                          .map(key => renderEditField(key as keyof Profile))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-2">
                {PRIMARY_FIELDS.map(key => renderViewField(key))}
              </div>
            )}
          </div>
        </div>
        
        {/* Introductions Section */}
        <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Introductions</h2>
          
          {isEditMode ? (
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
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Introductions This Person Would Like</h3>
                <div className="bg-gray-50 rounded-md p-4 text-gray-800">
                  {introSought || "No information provided"}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reasons to Introduce Someone to This Person</h3>
                <div className="bg-gray-50 rounded-md p-4 text-gray-800">
                  {reasonToIntroduce || "No information provided"}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Notes/Timeline Section */}
        <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          
          {/* Add new note */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add a Note</h3>
            <AudioRecorder 
              profileId={initialProfile.id} 
              onRecordingComplete={handleRecordingComplete}
            />
          </div>
          
          {/* Timeline of notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
            
            {isLoadingNotes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-6">
                {notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-indigo-300 pl-4">
                    <div className="text-sm text-gray-500 mb-1">
                      {formatDate(note.created_at)}
                    </div>
                    <div className="text-gray-800">
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No notes have been added yet.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
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