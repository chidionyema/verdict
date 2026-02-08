/**
 * Email Notification System
 * Basic implementation for critical user communications
 */

import { APP_CONFIG } from './app-config';
import { sendEmail as sendEmailViaResend } from './email';
import { generateUnsubscribeToken } from '@/app/api/email/unsubscribe/route';

// CAN-SPAM compliant email footer
function getEmailFooter(userId?: string, email?: string): { text: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verdict.app';
  const unsubscribeUrl = userId && email
    ? `${appUrl}/api/email/unsubscribe?token=${generateUnsubscribeToken(userId, email)}`
    : `${appUrl}/settings/notifications`;

  return {
    text: `\n\n---\nVerdict Inc.\nTo manage your email preferences or unsubscribe, visit: ${unsubscribeUrl}`,
    html: `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <p style="margin: 0 0 8px 0;">Verdict Inc.</p>
        <p style="margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
          &nbsp;|&nbsp;
          <a href="${appUrl}/settings/notifications" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a>
        </p>
      </div>
    `
  };
}

export type EmailTemplate = 
  | 'submission_received'
  | 'feedback_ready'
  | 'credit_earned'
  | 'submission_complete'
  | 'weekly_summary';

interface EmailData {
  to: string;
  name?: string;
  submissionId?: string;
  feedbackCount?: number;
  creditsEarned?: number;
  customData?: Record<string, any>;
  userId?: string; // For generating unsubscribe links
}

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

// Email templates with dynamic content
const EMAIL_TEMPLATES: Record<EmailTemplate, (data: EmailData) => EmailContent> = {
  submission_received: (data) => ({
    subject: "✅ Your feedback request is live!",
    text: `Hi ${data.name || 'there'}!\n\nYour submission has been received and is now being reviewed by our community.\n\nYou'll get notified as each feedback report comes in. Expect your first response within the next 2 hours.\n\nTrack progress: https://verdict.app/dashboard\n\nBest,\nThe Verdict Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">✅ Your feedback request is live!</h2>
        <p>Hi ${data.name || 'there'}!</p>
        <p>Your submission has been received and is now being reviewed by our community.</p>
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Community reviewers will provide ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} detailed feedback reports</li>
            <li>You'll be notified as each review comes in</li>
            <li>Expect your first response within ${APP_CONFIG.DELIVERY.COMMUNITY_AVG_HOURS} hours</li>
          </ul>
        </div>
        <a href="https://verdict.app/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Track Progress →</a>
        <p style="color: #6b7280; font-size: 14px;">Best,<br>The Verdict Team</p>
      </div>
    `
  }),

  feedback_ready: (data) => ({
    subject: `🎉 New feedback arrived! (${data.feedbackCount}/${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION})`,
    text: `Hi ${data.name || 'there'}!\n\nGreat news! You've received new feedback on your submission.\n\nProgress: ${data.feedbackCount}/${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} reviews complete\n\nView your feedback: https://verdict.app/dashboard/${data.submissionId}\n\n${data.feedbackCount === APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION ? 'All reviews are now complete!' : `Still waiting for ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION - (data.feedbackCount || 0)} more reviews.`}\n\nBest,\nThe Verdict Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">🎉 New feedback arrived!</h2>
        <p>Hi ${data.name || 'there'}!</p>
        <p>Great news! You've received new feedback on your submission.</p>
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📊</span>
            <div>
              <p style="margin: 0; font-weight: bold;">Progress: ${data.feedbackCount}/${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} reviews</p>
              <div style="background: #d1fae5; height: 8px; border-radius: 4px; width: 200px; margin-top: 8px;">
                <div style="background: #059669; height: 8px; border-radius: 4px; width: ${((data.feedbackCount || 0) / APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION) * 100}%;"></div>
              </div>
            </div>
          </div>
        </div>
        ${data.feedbackCount === APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION 
          ? '<div style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;"><p style="margin: 0; font-weight: bold;">🎊 All reviews are now complete!</p></div>'
          : `<p>Still waiting for ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION - (data.feedbackCount || 0)} more reviews.</p>`
        }
        <a href="https://verdict.app/dashboard/${data.submissionId}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Feedback →</a>
        <p style="color: #6b7280; font-size: 14px;">Best,<br>The Verdict Team</p>
      </div>
    `
  }),

  credit_earned: (data) => ({
    subject: "🎉 You earned a credit! Time to submit.",
    text: `Hi ${data.name || 'there'}!\n\nCongratulations! You've completed ${APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT} quality reviews and earned 1 free submission credit.\n\nYour judgments help others make better decisions - thank you for contributing to the community!\n\nReady to use your credit? Submit your own request: https://verdict.app/start\n\nBest,\nThe Verdict Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">🎉 You earned a credit!</h2>
        <p>Hi ${data.name || 'there'}!</p>
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 20px; border-radius: 12px; color: white; text-align: center; margin: 20px 0;">
          <h3 style="color: white; margin: 0 0 10px 0;">Credit Earned! 🎊</h3>
          <p style="margin: 0; font-size: 18px;">You completed ${APP_CONFIG.CREDITS.JUDGMENTS_PER_CREDIT} quality reviews</p>
        </div>
        <p>Your judgments help others make better decisions - thank you for contributing to the community!</p>
        <a href="https://verdict.app/start" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Use Your Credit →</a>
        <p style="color: #6b7280; font-size: 14px;">Best,<br>The Verdict Team</p>
      </div>
    `
  }),

  submission_complete: (data) => ({
    subject: "✨ Your feedback is complete! Here's what people said.",
    text: `Hi ${data.name || 'there'}!\n\nYour submission has received all ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} feedback reports!\n\nView your complete results: https://verdict.app/dashboard/${data.submissionId}\n\nDon't forget to:\n- Review the key takeaways\n- Share your success story if you'd like\n- Help others by reviewing their submissions\n\nBest,\nThe Verdict Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">✨ Your feedback is complete!</h2>
        <p>Hi ${data.name || 'there'}!</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 2px solid #22c55e; text-align: center; margin: 20px 0;">
          <h3 style="color: #15803d; margin: 0 0 10px 0;">🎊 All ${APP_CONFIG.FEEDBACK.REPORTS_PER_SUBMISSION} Reviews Complete!</h3>
          <p style="margin: 0; color: #166534;">Your insights are ready to view</p>
        </div>
        <p><strong>Next steps:</strong></p>
        <ul style="color: #374151;">
          <li>Review your detailed feedback and key takeaways</li>
          <li>Share your success story if you'd like</li>
          <li>Help others by reviewing their submissions</li>
        </ul>
        <a href="https://verdict.app/dashboard/${data.submissionId}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Results →</a>
        <p style="color: #6b7280; font-size: 14px;">Best,<br>The Verdict Team</p>
      </div>
    `
  }),

  weekly_summary: (data) => ({
    subject: "📊 Your weekly Verdict summary",
    text: `Hi ${data.name || 'there'}!\n\nHere's your Verdict activity this week:\n\n- Submissions: ${data.customData?.submissions || 0}\n- Reviews given: ${data.customData?.reviews || 0}\n- Credits earned: ${data.customData?.credits || 0}\n\nCommunity highlights:\n- ${data.customData?.communityStats || 'Growing strong!'}\n\nKeep up the great work!\n\nBest,\nThe Verdict Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">📊 Your weekly Verdict summary</h2>
        <p>Hi ${data.name || 'there'}!</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Activity This Week</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
            <div style="background: white; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #4f46e5;">${data.customData?.submissions || 0}</div>
              <div style="font-size: 14px; color: #6b7280;">Submissions</div>
            </div>
            <div style="background: white; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${data.customData?.reviews || 0}</div>
              <div style="font-size: 14px; color: #6b7280;">Reviews Given</div>
            </div>
            <div style="background: white; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${data.customData?.credits || 0}</div>
              <div style="font-size: 14px; color: #6b7280;">Credits Earned</div>
            </div>
          </div>
        </div>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">Community Highlights</h4>
          <p style="margin-bottom: 0; color: #78350f;">${data.customData?.communityStats || 'The community is growing strong!'}</p>
        </div>
        <p>Keep up the great work!</p>
        <a href="https://verdict.app/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Dashboard →</a>
        <p style="color: #6b7280; font-size: 14px;">Best,<br>The Verdict Team</p>
      </div>
    `
  })
};

// Mock email service (replace with actual service)
export class EmailService {
  private isProduction = process.env.NODE_ENV === 'production';
  private emailProvider = process.env.EMAIL_PROVIDER || 'mock';

  async sendEmail(template: EmailTemplate, data: EmailData): Promise<boolean> {
    try {
      const content = EMAIL_TEMPLATES[template](data);

      // Add CAN-SPAM compliant footer to all emails
      const footer = getEmailFooter(data.userId, data.to);
      const contentWithFooter: EmailContent = {
        subject: content.subject,
        text: content.text + footer.text,
        html: content.html.replace('</div>', `${footer.html}</div>`)
      };

      if (!this.isProduction) {
        // Development mode - just log the email
        console.log('📧 EMAIL NOTIFICATION (Dev Mode)');
        console.log('To:', data.to);
        console.log('Subject:', contentWithFooter.subject);
        console.log('Text:', contentWithFooter.text);
        return true;
      }

      // Production mode - integrate with actual service
      switch (this.emailProvider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(contentWithFooter, data);
        case 'mailgun':
          return await this.sendWithMailgun(contentWithFooter, data);
        case 'resend':
          return await this.sendWithResend(contentWithFooter, data);
        default:
          console.warn('No email provider configured');
          return false;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private async sendWithSendGrid(content: EmailContent, data: EmailData): Promise<boolean> {
    // SendGrid not implemented - use Resend instead
    console.error('SendGrid email provider not implemented. Set EMAIL_PROVIDER=resend');
    return false;
  }

  private async sendWithMailgun(content: EmailContent, data: EmailData): Promise<boolean> {
    // Mailgun not implemented - use Resend instead
    console.error('Mailgun email provider not implemented. Set EMAIL_PROVIDER=resend');
    return false;
  }

  private async sendWithResend(content: EmailContent, data: EmailData): Promise<boolean> {
    try {
      const result = await sendEmailViaResend({
        to: data.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });

      if (!result.success) {
        console.error('Resend email failed:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Resend email error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Import smart notification manager for rate limiting
import { shouldNotify, smartNotificationManager, NotificationContext } from './notifications/smart-notifications';

// Utility functions for common notification patterns with smart rate limiting
export async function notifySubmissionReceived(email: string, name: string, submissionId: string, userId?: string) {
  // Submission received is high priority - always send
  const sent = await emailService.sendEmail('submission_received', {
    to: email,
    name,
    submissionId,
    userId // For unsubscribe link
  });

  if (sent && userId) {
    await smartNotificationManager.recordNotificationSent(userId);
  }
  return sent;
}

export async function notifyFeedbackReady(email: string, name: string, submissionId: string, feedbackCount: number, userId?: string) {
  // Check smart notification limits
  if (userId) {
    const context: NotificationContext = {
      type: 'new_response',
      priority: 'medium',
      userId,
      requestId: submissionId
    };

    if (!(await shouldNotify(context))) {
      console.log(`Skipping notification for ${userId} due to rate limiting`);
      return false;
    }
  }

  const sent = await emailService.sendEmail('feedback_ready', {
    to: email,
    name,
    submissionId,
    feedbackCount,
    userId // For unsubscribe link
  });

  if (sent && userId) {
    await smartNotificationManager.recordNotificationSent(userId);
  }
  return sent;
}

export async function notifyCreditEarned(email: string, name: string, userId?: string) {
  // Check smart notification limits
  if (userId) {
    const context: NotificationContext = {
      type: 'credits_earned',
      priority: 'low',
      userId
    };

    if (!(await shouldNotify(context))) {
      console.log(`Skipping credit notification for ${userId} due to rate limiting`);
      return false;
    }
  }

  const sent = await emailService.sendEmail('credit_earned', {
    to: email,
    name,
    userId // For unsubscribe link
  });

  if (sent && userId) {
    await smartNotificationManager.recordNotificationSent(userId);
  }
  return sent;
}

export async function notifySubmissionComplete(email: string, name: string, submissionId: string, userId?: string) {
  // Submission complete is high priority - always send
  const sent = await emailService.sendEmail('submission_complete', {
    to: email,
    name,
    submissionId,
    userId // For unsubscribe link
  });

  if (sent && userId) {
    await smartNotificationManager.recordNotificationSent(userId);
  }
  return sent;
}