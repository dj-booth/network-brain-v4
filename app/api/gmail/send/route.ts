import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/gmailService';
import { getAuthenticatedUser } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { to, subject, body, cc, bcc, isHtml = true } = await request.json();
    
    // Validate required fields
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required parameters: to, subject, body' },
        { status: 400 }
      );
    }
    
    // Send email
    const result = await sendEmail(
      user.email,
      to,
      subject,
      body,
      cc,
      bcc,
      { isHtml }
    );
    
    // Return success
    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 