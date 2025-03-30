import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { IntroductionForm } from '../../components/IntroductionForm';
import type { Profile, ProfileWithEmbeddings } from '../../types/profile';

interface NewIntroductionPageProps {
  searchParams: {
    from: string;
    to: string;
  };
}

async function getProfilesWithEmbeddings(fromId: string, toId: string): Promise<{
  fromProfile: ProfileWithEmbeddings;
  toProfile: ProfileWithEmbeddings;
} | null> {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch both profiles
  const [fromResult, toResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', fromId).single(),
    supabase.from('profiles').select('*').eq('id', toId).single()
  ]);

  if (fromResult.error || toResult.error || !fromResult.data || !toResult.data) {
    console.error('Error fetching profiles:', fromResult.error || toResult.error);
    return null;
  }

  // Fetch embeddings for both profiles
  const [fromEmbeddings, toEmbeddings] = await Promise.all([
    supabase.from('embeddings').select('*').eq('profile_id', fromId),
    supabase.from('embeddings').select('*').eq('profile_id', toId)
  ]);

  if (fromEmbeddings.error || toEmbeddings.error) {
    console.error('Error fetching embeddings:', fromEmbeddings.error || toEmbeddings.error);
    return null;
  }

  return {
    fromProfile: {
      ...fromResult.data,
      embeddings: fromEmbeddings.data || []
    },
    toProfile: {
      ...toResult.data,
      embeddings: toEmbeddings.data || []
    }
  };
}

function generateIntroductionDraft(fromProfile: ProfileWithEmbeddings, toProfile: ProfileWithEmbeddings) {
  // Get relevant embeddings
  const fromReasonToIntroduce = fromProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';
  const toReasonToIntroduce = toProfile.embeddings.find(e => e.type === 'reason_to_introduce')?.content || '';
  
  // Generate drafts for both emails
  const toFromDraft = `Hi ${fromProfile.full_name},

I'd like to introduce you to ${toProfile.full_name} from ${toProfile.startup_name}. ${toReasonToIntroduce}

${toProfile.full_name} is looking to connect with people like yourself because ${toProfile.startup_differentiator}.

Would you be open to an introduction?

Best regards`;

  const toToDraft = `Hi ${toProfile.full_name},

I'd like to introduce you to ${fromProfile.full_name} from ${fromProfile.startup_name}. ${fromReasonToIntroduce}

${fromProfile.full_name} is looking to connect with people like yourself because ${fromProfile.startup_differentiator}.

Would you be open to an introduction?

Best regards`;

  return {
    toFromDraft,
    toToDraft
  };
}

export default async function NewIntroductionPage({ searchParams }: NewIntroductionPageProps) {
  const { from, to } = searchParams;
  
  if (!from || !to) {
    notFound();
  }

  const profiles = await getProfilesWithEmbeddings(from, to);
  
  if (!profiles) {
    notFound();
  }

  const { fromProfile, toProfile } = profiles;
  const { toFromDraft, toToDraft } = generateIntroductionDraft(fromProfile, toProfile);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Introduction</h1>
        <IntroductionForm
          fromProfile={fromProfile}
          toProfile={toProfile}
          initialDrafts={{
            toFrom: toFromDraft,
            toTo: toToDraft
          }}
        />
      </div>
    </div>
  );
} 