import { Resend } from 'resend';

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - emails will not be sent');
    return null;
  }
  return new Resend(apiKey);
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Verdict <noreply@verdict.app>';
const APP_URL = process.env.NODE_ENV === 'development' 
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : (process.env.NEXT_PUBLIC_APP_URL || (() => { throw new Error('APP_URL required for email links in production') })());

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; id?: string }> {
  const resend = getResendClient();

  if (!resend) {
    console.error('Email not sent - Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Email Templates
export const emailTemplates = {
  welcome: (data: { name?: string }) => ({
    subject: 'Welcome to Verdict!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; margin: 0;">Welcome to Verdict</h1>
          </div>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thank you for joining Verdict! We're excited to have you as part of our community.</p>
          <p>Get started by submitting your first request for honest, anonymous feedback from real people.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/start-simple" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Submit Your First Request</a>
          </div>
          <p>If you have any questions, our support team is here to help.</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  verificationCode: (data: { code: string; email: string }) => ({
    subject: 'Verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; margin: 0;">Verify Your Email</h1>
          </div>
          <p>Enter this verification code to confirm your email address:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #F3F4F6; padding: 16px 32px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1F2937;">${data.code}</div>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this verification, you can safely ignore this email.</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  passwordReset: (data: { resetLink: string }) => ({
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; margin: 0;">Reset Your Password</h1>
          </div>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  requestCreated: (data: { requestId: string; category?: string; title?: string }) => ({
    subject: 'Your Verdict request is live',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; margin: 0;">Your Request is Live</h1>
          </div>
          <p>Great news! We've received your request${data.category ? ` in the <strong>${data.category}</strong> category` : ''} and matched it with our judges.</p>
          <p>You'll receive notifications as verdicts come in.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/requests/${data.requestId}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View My Request</a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">You can also find this under <strong>My Requests</strong> in the app.</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  verdictProgress: (data: { requestId: string; receivedCount: number; targetCount: number; title?: string }) => ({
    subject: `New verdict received (${data.receivedCount}/${data.targetCount})`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; margin: 0;">New Verdict Received</h1>
          </div>
          <p>Your request${data.title ? ` "<strong>${data.title}</strong>"` : ''} now has <strong>${data.receivedCount} of ${data.targetCount}</strong> verdicts.</p>
          <p>You can start reading feedback now while the remaining verdicts arrive.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/requests/${data.requestId}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Verdicts</a>
          </div>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  verdictCompleted: (data: { requestId: string; targetCount: number; title?: string }) => ({
    subject: 'All verdicts are in — your results are ready!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #10B981; margin: 0;">Your Verdicts Are Ready!</h1>
          </div>
          <p>Great news! Your request${data.title ? ` "<strong>${data.title}</strong>"` : ''} has received all <strong>${data.targetCount}</strong> verdicts.</p>
          <p>Your full results and summary are ready to view.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/requests/${data.requestId}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View All Results</a>
          </div>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),

  paymentReceived: (data: { amount: string; credits: number }) => ({
    subject: 'Payment received — credits added!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #10B981; margin: 0;">Payment Received</h1>
          </div>
          <p>Thank you for your payment of <strong>${data.amount}</strong>!</p>
          <p><strong>${data.credits} credits</strong> have been added to your account. You can now submit more requests for feedback.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/start-simple" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Submit a Request</a>
          </div>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">— The Verdict Team</p>
        </body>
      </html>
    `,
  }),
};

// Convenience functions for common emails
export async function sendWelcomeEmail(to: string, name?: string) {
  const template = emailTemplates.welcome({ name });
  return sendEmail({ to, ...template });
}

export async function sendVerificationEmail(to: string, code: string) {
  const template = emailTemplates.verificationCode({ code, email: to });
  return sendEmail({ to, ...template });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const template = emailTemplates.passwordReset({ resetLink });
  return sendEmail({ to, ...template });
}

export async function sendRequestCreatedEmail(to: string, requestId: string, category?: string, title?: string) {
  const template = emailTemplates.requestCreated({ requestId, category, title });
  return sendEmail({ to, ...template });
}

export async function sendVerdictProgressEmail(
  to: string,
  requestId: string,
  receivedCount: number,
  targetCount: number,
  title?: string
) {
  const template = emailTemplates.verdictProgress({ requestId, receivedCount, targetCount, title });
  return sendEmail({ to, ...template });
}

export async function sendVerdictCompletedEmail(to: string, requestId: string, targetCount: number, title?: string) {
  const template = emailTemplates.verdictCompleted({ requestId, targetCount, title });
  return sendEmail({ to, ...template });
}

export async function sendPaymentReceivedEmail(to: string, amount: string, credits: number) {
  const template = emailTemplates.paymentReceived({ amount, credits });
  return sendEmail({ to, ...template });
}
