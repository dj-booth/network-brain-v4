'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuggestedIntroductions } from './SuggestedIntroductions';
import { IntroductionModal } from './IntroductionModal';
import type { Profile, ProfileWithEmbeddings } from '../types/profile';

interface SuggestedIntroductionsWrapperProps {
  suggestions: Array<{
    profile: Profile;
    matchReason: string;
    matchScore: number;
  }>;
  currentProfile: ProfileWithEmbeddings;
}

export function SuggestedIntroductionsWrapper({ suggestions, currentProfile }: SuggestedIntroductionsWrapperProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const router = useRouter();

  const handleIntroduceClick = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-text mb-6">Suggested Introductions</h2>
      <SuggestedIntroductions 
        suggestions={suggestions}
        onIntroduceClick={handleIntroduceClick}
      />
      {selectedProfile && (
        <IntroductionModal
          fromProfile={currentProfile}
          toProfile={selectedProfile as ProfileWithEmbeddings}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
} 