import React from 'react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <p className="text-gray-600">
          This page will contain settings for your account and application preferences.
        </p>
        
        <div className="mt-8 space-y-4">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Account Settings</h3>
            <p className="text-sm text-gray-500">
              Coming soon: Manage your account details and preferences.
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Notification Preferences</h3>
            <p className="text-sm text-gray-500">
              Coming soon: Control how and when you receive notifications.
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">API Settings</h3>
            <p className="text-sm text-gray-500">
              Coming soon: Manage API keys and integration settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 