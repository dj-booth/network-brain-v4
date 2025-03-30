'use client';

/// <reference types="react" />
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from '../compatibility/web-components';
import type { Profile } from '../types/profile';
import { SuggestedConnections } from './SuggestedConnections';

interface ProfileDetailProps {
  profile: Profile;
}

export const ProfileDetail: React.FC<ProfileDetailProps> = ({ profile }) => {
  const introsSought = profile.embeddings
    .filter(e => e.type === 'intro_sought')
    .map(e => e.content);

  const reasonsToConnect = profile.embeddings
    .filter(e => e.type === 'reason_to_introduce')
    .map(e => e.content);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
              <p className="text-gray-600">{profile.current_plan}</p>
              <p className="text-gray-500">{profile.location}</p>
            </div>
            <div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Connect
              </button>
            </div>
          </div>

          {/* Quick Bio Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Bio</h2>
            <p className="text-gray-700">{profile.cofounders_context}</p>
          </div>

          {/* Intros Sought Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Intros Sought</h2>
            <ul className="list-disc list-inside space-y-2">
              {introsSought.map((intro: string, index: number) => (
                <li key={index} className="text-gray-700">{intro}</li>
              ))}
            </ul>
          </div>

          {/* Reasons to Connect Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Reasons to Connect</h2>
            <ul className="list-disc list-inside space-y-2">
              {reasonsToConnect.map((reason: string, index: number) => (
                <li key={index} className="text-gray-700">{reason}</li>
              ))}
            </ul>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skillset?.split(',').map((skill: string, index: number) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Industry</h2>
              <p className="text-gray-700">{profile.startup_name}</p>
            </div>
          </div>

          {/* Suggested Connections */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Suggested Connections</h2>
            <SuggestedConnections profileId={profile.id} />
          </div>
        </div>
      </div>
    </div>
  );
}; 