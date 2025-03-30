'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { ProfileWithEmbeddings } from '../types/profile';

interface IntroductionFormProps {
  fromProfile: ProfileWithEmbeddings;
  toProfile: ProfileWithEmbeddings;
  initialDrafts: {
    toFrom: string;
    toTo: string;
  };
}

export function IntroductionForm({ fromProfile, toProfile, initialDrafts }: IntroductionFormProps) {
  const [toFromDraft, setToFromDraft] = useState(initialDrafts.toFrom);
  const [toToDraft, setToToDraft] = useState(initialDrafts.toTo);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Create introduction record
      const { error: introError } = await supabase
        .from('introductions')
        .insert({
          from_profile_id: fromProfile.id,
          to_profile_id: toProfile.id,
          status: 'pending',
          method: 'email'
        });

      if (introError) throw introError;

      // Send emails using Gmail OAuth
      const { error: emailError } = await supabase
        .from('email_logs')
        .insert([
          {
            profile_id: fromProfile.id,
            email_subject: `Introduction to ${toProfile.full_name}`,
            email_body: toFromDraft,
            bcc_logged: true
          },
          {
            profile_id: toProfile.id,
            email_subject: `Introduction to ${fromProfile.full_name}`,
            email_body: toToDraft,
            bcc_logged: true
          }
        ]);

      if (emailError) throw emailError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          profile_id: fromProfile.id,
          action_type: 'send_introduction',
          action_metadata: {
            to_profile_id: toProfile.id,
            email_drafts: {
              toFrom: toFromDraft,
              toTo: toToDraft
            }
          }
        });

      // Navigate back to the profile page
      router.push(`/profiles/${fromProfile.id}`);
      router.refresh();
    } catch (err) {
      console.error('Error sending introduction:', err);
      setError('Failed to send introduction. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* From Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{fromProfile.full_name}</h2>
          <p className="text-gray-600 mb-1">{fromProfile.startup_name}</p>
          <p className="text-gray-500 text-sm">{fromProfile.location}</p>
        </div>

        {/* To Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{toProfile.full_name}</h2>
          <p className="text-gray-600 mb-1">{toProfile.startup_name}</p>
          <p className="text-gray-500 text-sm">{toProfile.location}</p>
        </div>
      </div>

      {/* Email Drafts */}
      <div className="space-y-6">
        {/* First Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email to {fromProfile.full_name}
          </label>
          <textarea
            value={toFromDraft}
            onChange={(e) => setToFromDraft(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Second Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email to {toProfile.full_name}
          </label>
          <textarea
            value={toToDraft}
            onChange={(e) => setToToDraft(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send Introduction'}
        </button>
      </div>
    </div>
  );
} 