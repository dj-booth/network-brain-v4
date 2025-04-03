import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getTokens } from '@/app/lib/googleTokenStorage';
import { getAuthenticatedClient, getGmailApi } from '@/app/lib/googleAuth';

// JWT Secret for verifying session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is for testing Gmail API access. Use POST to send a test email.'
  });
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('nb_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the JWT token
    const payload = jwt.verify(sessionCookie, JWT_SECRET) as { email: string, sub: string };
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Get user's Google tokens
    const tokenData = await getTokens(payload.email);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'No Google connection found. Please connect to Google first.' }, { status: 400 });
    }
    
    // Convert stored tokens to format expected by Google API
    const tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date,
      token_type: tokenData.token_type,
      id_token: tokenData.id_token,
      scope: tokenData.scope
    };
    
    // Setup authenticated client
    const oauth2Client = getAuthenticatedClient(tokens);
    
    // Get Gmail API
    const gmail = getGmailApi(oauth2Client);
    
    // Get the recipient email from the request
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });
    }
    
    // Create a test email
    const subject = 'Network Brain Gmail API Test';
    const messageText = 'This is a test email sent from Network Brain to verify Gmail API integration is working correctly.';
    
    // Always BCC intros@somethingnew.nz
    const defaultBcc = 'intros@somethingnew.nz';
    
    // Construct the email
    let emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push(`Bcc: ${defaultBcc}`);
    emailLines.push('Content-Type: text/plain; charset=UTF-8');
    emailLines.push('');
    emailLines.push(messageText);
    
    const email = emailLines.join('\r\n');
    
    // Base64 encode the email (URL-safe)
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${to}`,
      email_id: response.data.id
    });
    
  } catch (error) {
    console.error('Error testing Gmail API:', error);
    return NextResponse.json({ 
      error: 'Failed to test Gmail API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 