'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';

interface AudioRecorderProps {
  profileId: string;
  onRecordingComplete?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ profileId, onRecordingComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  const supabase = createClientComponentClient();

  // Initialize voice visualizer hook
  const recorderControls = useVoiceVisualizer({
    onStartRecording: () => {
      setError(null);
      setSaveSuccess(false);
      chunksRef.current = [];
    },
    onStopRecording: () => {
      setIsProcessing(true);
      if (recorderControls.recordedBlob) {
        processAudio(recorderControls.recordedBlob);
      }
    }
  });

  // Get the recorded audio blob
  useEffect(() => {
    if (!recorderControls.recordedBlob) return;
    
    console.log('Recorded blob:', recorderControls.recordedBlob);
  }, [recorderControls.recordedBlob]);

  // Get errors from the recorder
  useEffect(() => {
    if (!recorderControls.error) return;
    
    setError('Error accessing microphone. Please check permissions.');
    console.error('Recorder error:', recorderControls.error);
  }, [recorderControls.error]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        try {
          setNoteText('Transcribing audio...');
          
          // Send to API route for transcription
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: base64Data,
              profileId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to transcribe audio');
          }

          const { text } = await response.json();
          
          // Update the note text with the transcription
          setNoteText(text);
          setError(null); // Clear any previous errors
        } catch (apiError) {
          console.error('API error:', apiError);
          // Still allow the user to manually enter a note if transcription fails
          setNoteText(''); 
          setError('Transcription failed. Please type your note manually.');
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process recording. Please try again or type your note manually.');
      setIsProcessing(false);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) {
      setError('Please enter some text for the note.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      // Send note to the API
      const response = await fetch(`/api/notes/${profileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: noteText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      // Clear text and show success message
      setSaveSuccess(true);
      setNoteText('');
      
      // Notify parent component to refresh notes
      if (onRecordingComplete) {
        onRecordingComplete();
      }

    } catch (err) {
      console.error('Error saving note:', err);
      setError(`Failed to save note: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {error && (
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="text-green-600 bg-green-50 px-4 py-2 rounded-md text-sm">
          Note saved successfully!
        </div>
      )}
      
      <div className="flex flex-col items-start space-y-4">
        <div className="flex items-center space-x-4 w-full">
          <button
            onClick={recorderControls.isRecordingInProgress ? recorderControls.stopRecording : recorderControls.startRecording}
            disabled={isProcessing || isSaving}
            className={`p-4 rounded-full transition-all ${
              recorderControls.isRecordingInProgress
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } ${(isProcessing || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {recorderControls.isRecordingInProgress ? (
              <StopIcon className="h-8 w-8 text-white" />
            ) : (
              <MicrophoneIcon className="h-8 w-8 text-white" />
            )}
          </button>
          
          {/* Status text */}
          {recorderControls.isRecordingInProgress && (
            <span className="text-red-600 font-medium animate-pulse">
              Recording... {recorderControls.formattedRecordingTime}
            </span>
          )}
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600">Processing recording...</span>
            </div>
          )}
        </div>
        
        {/* Voice visualizer */}
        <div className="w-full h-24 bg-gray-50 rounded-md overflow-hidden">
          <VoiceVisualizer
            controls={recorderControls}
            height={96}
            width="100%"
            backgroundColor="#f9fafb"
            mainBarColor="#6366f1"
            secondaryBarColor="#818cf8"
            isControlPanelShown={false}
            isDownloadAudioButtonShown={false}
            animateCurrentPick={true}
          />
        </div>

        <div className="flex-1 flex flex-col space-y-2 w-full">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type your note here or record audio to transcribe..."
            className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={recorderControls.isRecordingInProgress || isProcessing}
          />
          
          <button
            onClick={saveNote}
            disabled={recorderControls.isRecordingInProgress || isProcessing || isSaving || !noteText.trim()}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (recorderControls.isRecordingInProgress || isProcessing || isSaving || !noteText.trim()) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}; 