// Robust notification helper with retry logic and fallbacks
import {
  sendRequestCreatedEmail,
  sendVerdictProgressEmail,
  sendVerdictCompletedEmail,
} from './email';
import { log } from './logger';

export type RequestLifecycleEmailType =
  | 'request_created'
  | 'verdict_progress'
  | 'verdict_completed';

interface BaseEmailParams {
  to: string;
  requestId: string;
  userId?: string;
  title?: string;
  category?: string;
}

interface VerdictProgressParams extends BaseEmailParams {
  receivedCount: number;
  targetCount: number;
}

interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  inAppCreated: boolean;
  error?: string;
}

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        log.warn(`${context} failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          error: lastError.message,
        });
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

async function createInAppNotification(
  userId: string,
  type: RequestLifecycleEmailType,
  params: BaseEmailParams | VerdictProgressParams
): Promise<boolean> {
  // Import dynamically to avoid circular dependencies
  const { createServiceClient } = await import('./supabase/server');

  try {
    const supabase = createServiceClient();

    let title: string;
    let message: string;
    let actionUrl: string;

    switch (type) {
      case 'request_created':
        title = 'Request Submitted';
        message = `Your request "${params.title || 'Untitled'}" has been submitted and is now awaiting verdicts.`;
        actionUrl = `/requests/${params.requestId}`;
        break;

      case 'verdict_progress': {
        const vp = params as VerdictProgressParams;
        title = 'New Verdict Received';
        message = `You've received ${vp.receivedCount} of ${vp.targetCount} verdicts on your request.`;
        actionUrl = `/requests/${params.requestId}`;
        break;
      }

      case 'verdict_completed': {
        const vp = params as VerdictProgressParams;
        title = 'All Verdicts Received!';
        message = `All ${vp.targetCount} verdicts are in for your request. View your results now!`;
        actionUrl = `/requests/${params.requestId}`;
        break;
      }
    }

    await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_metadata: JSON.stringify({
        request_id: params.requestId,
        action_label: 'View Request',
        action_url: actionUrl,
        priority: type === 'verdict_completed' ? 'high' : 'normal',
      }),
    });

    return true;
  } catch (error) {
    log.error('Failed to create in-app notification', error, { userId, type });
    return false;
  }
}

export async function sendRequestLifecycleEmail(
  type: RequestLifecycleEmailType,
  params: BaseEmailParams | VerdictProgressParams
): Promise<NotificationResult> {
  const { to, requestId, userId, title, category } = params;

  const result: NotificationResult = {
    success: false,
    emailSent: false,
    inAppCreated: false,
  };

  // Attempt to send email with retry
  if (to) {
    try {
      await withRetry(async () => {
        let emailResult: { success: boolean; error?: string };

        switch (type) {
          case 'request_created':
            emailResult = await sendRequestCreatedEmail(to, requestId, category, title);
            break;

          case 'verdict_progress': {
            const vp = params as VerdictProgressParams;
            emailResult = await sendVerdictProgressEmail(to, requestId, vp.receivedCount, vp.targetCount, title);
            break;
          }

          case 'verdict_completed': {
            const vp = params as VerdictProgressParams;
            emailResult = await sendVerdictCompletedEmail(to, requestId, vp.targetCount, title);
            break;
          }
        }

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Email send failed');
        }

        return emailResult;
      }, MAX_RETRIES, `Email send (${type})`);

      result.emailSent = true;
      log.info('Lifecycle email sent successfully', {
        type,
        requestId,
        to: to.substring(0, 3) + '***', // Mask email for logs
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.error = `Email failed after ${MAX_RETRIES} attempts: ${errorMessage}`;

      log.error('Failed to send lifecycle email after retries', error, {
        type,
        requestId,
        attempts: MAX_RETRIES,
      });
    }
  }

  // Create in-app notification as primary or fallback
  if (userId) {
    result.inAppCreated = await createInAppNotification(userId, type, params);

    if (!result.emailSent && result.inAppCreated) {
      log.info('Email failed but in-app notification created', {
        type,
        requestId,
        userId,
      });
    }
  }

  // Consider success if either email or in-app notification worked
  result.success = result.emailSent || result.inAppCreated;

  return result;
}

