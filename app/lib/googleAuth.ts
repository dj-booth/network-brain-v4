import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Define the scopes we need for Google Calendar and Gmail
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',   // Read-only access to Google Calendar
  'https://www.googleapis.com/auth/gmail.send',         // Send emails through Gmail
  'https://www.googleapis.com/auth/userinfo.email',      // Get user email
  'https://www.googleapis.com/auth/userinfo.profile'    // Get user profile info
];

// Create a new OAuth2 client
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate the authorization URL for Google OAuth
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    // Setting prompt to consent forces a new refresh token to be generated
    prompt: 'consent'
  });
}

// Exchange the authorization code for tokens
export async function getTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Set up an OAuth2Client with existing tokens
export function getAuthenticatedClient(tokens: any) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// Get Google Calendar API instance
export function getCalendarApi(auth: OAuth2Client) {
  return google.calendar({ version: 'v3', auth });
}

// Get Gmail API instance
export function getGmailApi(auth: OAuth2Client) {
  return google.gmail({ version: 'v1', auth });
}

// Get user info from token
export async function getUserInfo(auth: OAuth2Client) {
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data;
} 