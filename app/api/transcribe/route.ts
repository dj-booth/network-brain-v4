import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// --- IMPORTANT ---
// Ensure you have OPENAI_API_KEY and JWT_SECRET set in your environment variables
// You will also need to install the openai package: npm install openai
// and a JWT library like jsonwebtoken: npm install jsonwebtoken @types/jsonwebtoken

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow specific Chrome extension origin
const ALLOWED_ORIGIN = 'chrome-extension://pofgfedjebidalhfhhfdbajjihnfamen'; // Use single value

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse, requestOrigin: string | null) {
  if (requestOrigin === ALLOWED_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  return response;
}

// This is a stub API route for audio transcription
// In a real implementation, this would use OpenAI's Whisper API

export async function POST(request: Request) {
  try {
    const { audio, profileId } = await request.json();
    
    // Check if we received audio data
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    console.log(`Processing audio recording for profile: ${profileId}`);
    
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(audio, 'base64');
      
      // Create a temporary file with the audio data
      const audioBlob = new Blob([buffer], { type: 'audio/webm' });
      const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      // Call OpenAI's Whisper API to transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      });
      
      console.log('Transcription successful');
      
      // Return the transcribed text
      return NextResponse.json({
        text: transcription.text
      });
    } catch (error: unknown) {
      console.error('OpenAI API error:', error);
      
      // Check if there's an API key configuration issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key configuration issue', details: errorMessage },
          { status: 500 }
        );
      }
      
      // For other OpenAI errors, return a general error
      return NextResponse.json(
        { error: 'Transcription service error', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return NextResponse.json(
      { error: 'Failed to process audio transcription' },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
  console.log("Received OPTIONS request on /api/transcribe");
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
} 