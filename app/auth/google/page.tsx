'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GoogleAuthPage() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated'>('checking');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [scopesGranted, setScopesGranted] = useState<{
    calendar: boolean;
    gmail: boolean;
  }>({ calendar: false, gmail: false });
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Check if the user is already authenticated with Google
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try to get user info from Google OAuth
        const response = await fetch('/api/auth/google/status');
        
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user || null);
          
          // Check which scopes we have
          setScopesGranted({
            calendar: data.scopes?.includes('https://www.googleapis.com/auth/calendar.readonly') || false,
            gmail: data.scopes?.includes('https://www.googleapis.com/auth/gmail.send') || false,
          });
          
          setAuthStatus(data.user ? 'authenticated' : 'not_authenticated');
        } else {
          setAuthStatus('not_authenticated');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus('not_authenticated');
      }
    };

    checkAuthStatus();
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    // Redirect to Google OAuth login
    window.location.href = '/api/auth/google/login';
  };

  const handleRevoke = async () => {
    setLoading(true);
    
    try {
      await fetch('/api/auth/google/revoke', { method: 'POST' });
      // Reset everything
      setUserInfo(null);
      setScopesGranted({ calendar: false, gmail: false });
      setAuthStatus('not_authenticated');
      setTestMessage({ type: 'success', text: 'Access revoked successfully' });
    } catch (error) {
      console.error('Error revoking access:', error);
      setTestMessage({ type: 'error', text: 'Failed to revoke access' });
    } finally {
      setLoading(false);
    }
  };

  const testCalendarAccess = async () => {
    setLoading(true);
    setTestMessage(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/auth/google/test');
      const data = await response.json();
      
      if (response.ok) {
        setTestMessage({ 
          type: 'success', 
          text: `Successfully connected to Google Calendar. Found ${data.total_events_found} upcoming events.` 
        });
        setTestResult(data);
      } else {
        setTestMessage({ type: 'error', text: data.error || 'Failed to test calendar access' });
      }
    } catch (error) {
      console.error('Error testing calendar access:', error);
      setTestMessage({ type: 'error', text: 'An error occurred while testing calendar access' });
    } finally {
      setLoading(false);
    }
  };

  const testGmailAccess = async () => {
    if (!testEmail) {
      setTestMessage({ type: 'error', text: 'Please enter a recipient email address' });
      return;
    }
    
    setLoading(true);
    setTestMessage(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/auth/google/test-gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: testEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestMessage({ 
          type: 'success', 
          text: `Test email successfully sent to ${testEmail}`
        });
        setTestResult(data);
      } else {
        setTestMessage({ type: 'error', text: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error testing Gmail access:', error);
      setTestMessage({ type: 'error', text: 'An error occurred while sending test email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Google Integration Setup</h2>
          <p className="text-gray-600 mb-4">
            Connect Network Brain to your Google account to enable calendar synchronization and email sending capabilities.
          </p>
        </div>

        {authStatus === 'checking' ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
            <p className="mt-4 text-gray-600">Checking authentication status...</p>
          </div>
        ) : authStatus === 'authenticated' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Connected to Google</h3>
                  <p className="text-sm text-gray-600">{userInfo?.email}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <div className={`${scopesGranted.calendar ? 'bg-green-100' : 'bg-yellow-100'} p-2 rounded-full mr-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${scopesGranted.calendar ? 'text-green-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={scopesGranted.calendar ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Google Calendar Access</h3>
                    <p className="text-sm text-gray-600">
                      {scopesGranted.calendar ? 'Calendar access granted' : 'Calendar access not granted'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`${scopesGranted.gmail ? 'bg-green-100' : 'bg-yellow-100'} p-2 rounded-full mr-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${scopesGranted.gmail ? 'text-green-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={scopesGranted.gmail ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Gmail Sending</h3>
                    <p className="text-sm text-gray-600">
                      {scopesGranted.gmail ? 'Email sending capability granted' : 'Email sending capability not granted'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAuth}
                  disabled={loading || (scopesGranted.calendar && scopesGranted.gmail)}
                  className="w-full px-4 py-2 bg-[rgb(255,196,3)] text-black font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (scopesGranted.calendar && scopesGranted.gmail) ? 'All Permissions Granted' : 'Grant Missing Permissions'}
                </button>
                
                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Revoke Access'}
                </button>
              </div>
            </div>

            {/* Test Access Panel */}
            {(scopesGranted.calendar || scopesGranted.gmail) && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Test Integration</h3>
                
                {testMessage && (
                  <div className={`mb-4 p-3 rounded-md ${
                    testMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                    testMessage.type === 'error' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <p>{testMessage.text}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Calendar Test */}
                  {scopesGranted.calendar && (
                    <div className="p-4 border border-gray-200 rounded-md">
                      <h4 className="font-medium mb-3">Test Calendar Access</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        This will test your Google Calendar connection by fetching a few upcoming events.
                      </p>
                      <button
                        onClick={testCalendarAccess}
                        disabled={loading}
                        className="px-4 py-2 bg-[rgb(255,196,3)] text-black font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50"
                      >
                        {loading ? 'Testing...' : 'Test Calendar Access'}
                      </button>
                    </div>
                  )}
                  
                  {/* Gmail Test */}
                  {scopesGranted.gmail && (
                    <div className="p-4 border border-gray-200 rounded-md">
                      <h4 className="font-medium mb-3">Test Email Sending</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Send a test email to verify the Gmail integration is working correctly.
                      </p>
                      <div className="flex space-x-2 mb-4">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="Recipient email"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[rgb(255,196,3)]"
                        />
                        <button
                          onClick={testGmailAccess}
                          disabled={loading || !testEmail}
                          className="px-4 py-2 bg-[rgb(255,196,3)] text-black font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50"
                        >
                          {loading ? 'Sending...' : 'Send Test Email'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Note: This will send a real email. A copy will be BCC'd to intros@somethingnew.nz as well.
                      </p>
                    </div>
                  )}
                </div>

                {/* Test Results */}
                {testResult && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">Test Results</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium">Connect to Google</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need to authenticate with Google to enable Calendar and Gmail features.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-md">
                <h4 className="font-medium">Permissions Requested:</h4>
                <ul className="mt-2 text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Read your Google Calendar events
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Send emails on your behalf
                  </li>
                </ul>
              </div>

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full px-4 py-2 bg-[rgb(255,196,3)] text-black font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Connect to Google'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 