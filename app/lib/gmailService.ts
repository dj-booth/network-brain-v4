import { getTokens } from './googleTokenStorage';
import { getAuthenticatedClient, getGmailApi } from './googleAuth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Send an email using Gmail API
 * @param userEmail - The email of the authenticated user
 * @param to - Recipient email address(es), can be comma-separated for multiple recipients
 * @param subject - Email subject
 * @param body - Email HTML body
 * @param cc - Optional CC recipients
 * @param bcc - Optional BCC recipients (always includes intros@somethingnew.nz)
 * @param options - Additional email options
 */
export async function sendEmail(
  userEmail: string,
  to: string,
  subject: string,
  body: string,
  cc?: string,
  bcc?: string,
  options: { isHtml?: boolean } = { isHtml: true }
) {
  try {
    // Get tokens from database
    const tokenData = await getTokens(userEmail);
    
    if (!tokenData) {
      throw new Error('No Google tokens found for user');
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
    
    // Always BCC intros@somethingnew.nz
    const defaultBcc = 'intros@somethingnew.nz';
    const combinedBcc = bcc ? `${bcc}, ${defaultBcc}` : defaultBcc;
    
    // Construct email
    let emailLines = [];
    emailLines.push(`To: ${to}`);
    emailLines.push(`Subject: ${subject}`);
    
    if (cc) {
      emailLines.push(`Cc: ${cc}`);
    }
    
    emailLines.push(`Bcc: ${combinedBcc}`);
    
    if (options.isHtml) {
      emailLines.push('Content-Type: text/html; charset=UTF-8');
    } else {
      emailLines.push('Content-Type: text/plain; charset=UTF-8');
    }
    
    emailLines.push('');
    emailLines.push(body);
    
    const email = emailLines.join('\r\n');
    
    // Base64 encode the email
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    // Log the email in the database
    await logEmail(userEmail, to, subject, body);
    
    return response.data;
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Log an email in the database
 * @param userEmail - The email of the sender
 * @param to - Recipient email
 * @param subject - Email subject
 * @param body - Email body
 */
async function logEmail(userEmail: string, to: string, subject: string, body: string) {
  try {
    // Find the profile ID for the recipient, if available
    let profileId = null;
    
    // Extract just the first email address if there are multiple recipients
    const primaryRecipient = to.split(',')[0].trim();
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', primaryRecipient)
      .limit(1);
    
    if (profileData && profileData.length > 0) {
      profileId = profileData[0].id;
    }
    
    // Log the email
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        profile_id: profileId,
        email_subject: subject,
        email_body: body,
        sent_at: new Date(),
        bcc_logged: true  // We always BCC intros@somethingnew.nz
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error logging email:', error);
      return null;
    }
    
    // Log the action in audit logs
    await supabase
      .from('audit_logs')
      .insert({
        profile_id: profileId,
        action_type: 'send_email',
        action_metadata: {
          sender: userEmail,
          recipient: to,
          subject: subject,
          email_log_id: data.id
        },
        performed_by: userEmail
      });
    
    return data;
    
  } catch (error) {
    console.error('Error logging email:', error);
    return null;
  }
} 