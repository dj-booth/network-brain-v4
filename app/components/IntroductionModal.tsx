'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { ProfileWithEmbeddings } from '../types/profile';
import { generateEmailContent } from '../utils/openai';

interface IntroductionModalProps {
  fromProfile: ProfileWithEmbeddings;
  toProfile: ProfileWithEmbeddings;
  onClose: () => void;
}

export function IntroductionModal({ fromProfile, toProfile, onClose }: IntroductionModalProps) {
  const [optInEmailFrom, setOptInEmailFrom] = useState('');
  const [optInEmailTo, setOptInEmailTo] = useState('');
  const [introductionEmail, setIntroductionEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<{[key: string]: boolean}>({
    optInFrom: false,
    optInTo: false,
    introduction: false
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    generateEmails();
  }, []);

  const generateEmails = async () => {
    setIsGenerating(true);
    try {
      // Get relevant embeddings
      const fromReasonToIntroduce = fromProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';
      const toReasonToIntroduce = toProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';

      // Generate opt-in email for the first person
      const optInFromPrompt = `Write a thoughtful email asking for an introduction opt-in. Context:
- Email is to: ${fromProfile.full_name} (${fromProfile.startup_name})
- Want to introduce them to: ${toProfile.full_name} (${toProfile.startup_name})
- Reason to introduce: ${toReasonToIntroduce}
- Their background: ${fromProfile.startup_differentiator}
- Keep it concise, professional, and personal
- Start with "Hey ${fromProfile.full_name.split(' ')[0]}, I thought of you for an intro"`;

      // Generate opt-in email for the second person
      const optInToPrompt = `Write a thoughtful email asking for an introduction opt-in. Context:
- Email is to: ${toProfile.full_name} (${toProfile.startup_name})
- Want to introduce them to: ${fromProfile.full_name} (${fromProfile.startup_name})
- Reason to introduce: ${fromReasonToIntroduce}
- Their background: ${toProfile.startup_differentiator}
- Keep it concise, professional, and personal
- Start with "Hey ${toProfile.full_name.split(' ')[0]}, I thought of you for an intro"`;

      // Generate direct introduction email
      const introductionPrompt = `Write a thoughtful email introducing two people. Context:
- Introducing: ${fromProfile.full_name} (${fromProfile.startup_name}) and ${toProfile.full_name} (${toProfile.startup_name})
- ${fromProfile.full_name}'s background: ${fromProfile.startup_differentiator}
- ${toProfile.full_name}'s background: ${toProfile.startup_differentiator}
- Reasons for introduction: ${fromReasonToIntroduce} and ${toReasonToIntroduce}
- Keep it concise, professional, and highlight mutual benefits
- Make it a warm, direct introduction`;

      // Call OpenAI for each email
      const [optInFrom, optInTo, introduction] = await Promise.all([
        generateEmailContent(optInFromPrompt),
        generateEmailContent(optInToPrompt),
        generateEmailContent(introductionPrompt)
      ]);

      setOptInEmailFrom(optInFrom);
      setOptInEmailTo(optInTo);
      setIntroductionEmail(introduction);
    } catch (err) {
      console.error('Error generating emails:', err);
      setError('Failed to generate email drafts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendOptIn = async (isFromProfile: boolean) => {
    setIsSending(true);
    setError(null);

    try {
      const profile = isFromProfile ? fromProfile : toProfile;
      const emailContent = isFromProfile ? optInEmailFrom : optInEmailTo;

      // Create introduction record
      const { error: introError } = await supabase
        .from('introductions')
        .insert({
          from_profile_id: fromProfile.id,
          to_profile_id: toProfile.id,
          status: 'opt_in_sent',
          method: 'email'
        });

      if (introError) throw introError;

      // Send email
      const { error: emailError } = await supabase
        .from('email_logs')
        .insert({
          profile_id: profile.id,
          email_subject: `Introduction to ${isFromProfile ? toProfile.full_name : fromProfile.full_name}`,
          email_body: emailContent,
          bcc_logged: true
        });

      if (emailError) throw emailError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          profile_id: profile.id,
          action_type: 'send_opt_in_request',
          action_metadata: {
            to_profile_id: isFromProfile ? toProfile.id : fromProfile.id,
            email_content: emailContent
          }
        });

      onClose();
      router.refresh();
    } catch (err) {
      console.error('Error sending opt-in:', err);
      setError('Failed to send opt-in request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendIntroduction = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Create introduction record
      const { error: introError } = await supabase
        .from('introductions')
        .insert({
          from_profile_id: fromProfile.id,
          to_profile_id: toProfile.id,
          status: 'introduced',
          method: 'email'
        });

      if (introError) throw introError;

      // Send email
      const { error: emailError } = await supabase
        .from('email_logs')
        .insert({
          profile_id: fromProfile.id,
          email_subject: `Introduction: ${fromProfile.full_name} <> ${toProfile.full_name}`,
          email_body: introductionEmail,
          bcc_logged: true
        });

      if (emailError) throw emailError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          profile_id: fromProfile.id,
          action_type: 'send_introduction',
          action_metadata: {
            to_profile_id: toProfile.id,
            email_content: introductionEmail
          }
        });

      onClose();
      router.refresh();
    } catch (err) {
      console.error('Error sending introduction:', err);
      setError('Failed to send introduction. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async (type: 'optInFrom' | 'optInTo' | 'introduction') => {
    setIsRegenerating(prev => ({ ...prev, [type]: true }));
    try {
      const fromReasonToIntroduce = fromProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';
      const toReasonToIntroduce = toProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';

      let prompt = '';
      let currentContent = '';

      switch (type) {
        case 'optInFrom':
          currentContent = optInEmailFrom;
          prompt = `Rewrite this email keeping the good parts but improving it further. Current email:
${currentContent}

Context for improvement:
- Email is to: ${fromProfile.full_name} (${fromProfile.startup_name})
- Want to introduce them to: ${toProfile.full_name} (${toProfile.startup_name})
- Reason to introduce: ${toReasonToIntroduce}
- Their background: ${fromProfile.startup_differentiator}
- Keep it concise, professional, and personal
- Must start with "Hey ${fromProfile.full_name.split(' ')[0]}, I thought of you for an intro"`;
          break;

        case 'optInTo':
          currentContent = optInEmailTo;
          prompt = `Rewrite this email keeping the good parts but improving it further. Current email:
${currentContent}

Context for improvement:
- Email is to: ${toProfile.full_name} (${toProfile.startup_name})
- Want to introduce them to: ${fromProfile.full_name} (${fromProfile.startup_name})
- Reason to introduce: ${fromReasonToIntroduce}
- Their background: ${toProfile.startup_differentiator}
- Keep it concise, professional, and personal
- Must start with "Hey ${toProfile.full_name.split(' ')[0]}, I thought of you for an intro"`;
          break;

        case 'introduction':
          currentContent = introductionEmail;
          prompt = `Rewrite this introduction email keeping the good parts but improving it further. Current email:
${currentContent}

Context for improvement:
- Introducing: ${fromProfile.full_name} (${fromProfile.startup_name}) and ${toProfile.full_name} (${toProfile.startup_name})
- ${fromProfile.full_name}'s background: ${fromProfile.startup_differentiator}
- ${toProfile.full_name}'s background: ${toProfile.startup_differentiator}
- Reasons for introduction: ${fromReasonToIntroduce} and ${toReasonToIntroduce}
- Keep it concise, professional, and highlight mutual benefits
- Make it a warm, direct introduction`;
          break;
      }

      const newContent = await generateEmailContent(prompt);

      switch (type) {
        case 'optInFrom':
          setOptInEmailFrom(newContent);
          break;
        case 'optInTo':
          setOptInEmailTo(newContent);
          break;
        case 'introduction':
          setIntroductionEmail(newContent);
          break;
      }
    } catch (err) {
      console.error('Error regenerating email:', err);
      setError('Failed to regenerate email. Please try again.');
    } finally {
      setIsRegenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Introduction Options</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Generating thoughtful introduction drafts...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* First Opt-in Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opt-in Request to {fromProfile.full_name}
                </label>
                <textarea
                  value={optInEmailFrom}
                  onChange={(e) => setOptInEmailFrom(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => handleRegenerate('optInFrom')}
                    disabled={isRegenerating.optInFrom || isSending}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isRegenerating.optInFrom ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => handleSendOptIn(true)}
                    disabled={isSending || isRegenerating.optInFrom}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send Opt-in Request'}
                  </button>
                </div>
              </div>

              {/* Second Opt-in Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opt-in Request to {toProfile.full_name}
                </label>
                <textarea
                  value={optInEmailTo}
                  onChange={(e) => setOptInEmailTo(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => handleRegenerate('optInTo')}
                    disabled={isRegenerating.optInTo || isSending}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isRegenerating.optInTo ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => handleSendOptIn(false)}
                    disabled={isSending || isRegenerating.optInTo}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send Opt-in Request'}
                  </button>
                </div>
              </div>

              {/* Direct Introduction Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Introduction Email
                </label>
                <textarea
                  value={introductionEmail}
                  onChange={(e) => setIntroductionEmail(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => handleRegenerate('introduction')}
                    disabled={isRegenerating.introduction || isSending}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isRegenerating.introduction ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={handleSendIntroduction}
                    disabled={isSending || isRegenerating.introduction}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send Direct Introduction'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 