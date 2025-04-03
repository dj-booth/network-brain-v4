'use client';

import { useState, FormEvent } from 'react';

interface EmailComposerProps {
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSuccess?: (response: any) => void;
}

export default function EmailComposer({
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  onSuccess
}: EmailComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isHtml, setIsHtml] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!to || !subject || !body) {
      setError('To, Subject, and Body are required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          cc,
          bcc,
          subject,
          body,
          isHtml
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      
      setSuccess('Email sent successfully!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Reset form fields 
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-[rgb(66,66,69)]">Compose Email</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="to">
            To*
          </label>
          <input
            id="to"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cc">
            Cc
          </label>
          <input
            id="cc"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bcc">
            Bcc (in addition to intros@somethingnew.nz)
          </label>
          <input
            id="bcc"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subject">
            Subject*
          </label>
          <input
            id="subject"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="body">
            Body*
          </label>
          <textarea
            id="body"
            className="w-full px-3 py-2 border border-gray-300 rounded-md h-40"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[rgb(255,196,3)]"
                checked={isHtml}
                onChange={(e) => setIsHtml(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Send as HTML</span>
            </label>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-[rgb(255,196,3)] text-black rounded hover:bg-opacity-90 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>
    </div>
  );
} 