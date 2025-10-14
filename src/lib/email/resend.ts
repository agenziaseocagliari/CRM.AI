// Client-safe email service that prevents Resend from being bundled in client code
// This service gracefully handles client-side calls by logging a warning

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

// Client-safe email function that skips execution in browser environments
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  // Always check if we're in a browser environment first
  if (typeof window !== 'undefined') {
    console.warn('Email sending skipped - running in browser environment. Emails should be sent from server-side code only.');
    return {
      success: false,
      message: 'Email service unavailable in browser environment'
    };
  }

  // Only proceed if we're in a server environment (Node.js)
  try {
    // Check for Node.js environment variables
    const apiKey = (globalThis as any).process?.env?.RESEND_API_KEY;
    const fromEmail = (globalThis as any).process?.env?.RESEND_FROM_EMAIL;

    if (!apiKey) {
      console.warn('Email sending skipped - RESEND_API_KEY not configured');
      return {
        success: false,
        message: 'Email service not configured - missing API key'
      };
    }

    // Dynamically import Resend to avoid bundling in client
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: params.from || fromEmail || 'noreply@crm-ai.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error,
        message: 'Failed to send email via Resend API'
      };
    }

    console.log('Email sent successfully:', data);
    return {
      success: true,
      data,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      error,
      message: 'Email service encountered an error'
    };
  }
}