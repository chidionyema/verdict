// Lightweight helper for sending lifecycle emails using Resend
import {
  sendRequestCreatedEmail,
  sendVerdictProgressEmail,
  sendVerdictCompletedEmail,
} from './email';

export type RequestLifecycleEmailType =
  | 'request_created'
  | 'verdict_progress'
  | 'verdict_completed';

interface BaseEmailParams {
  to: string;
  requestId: string;
  title?: string;
  category?: string;
}

interface VerdictProgressParams extends BaseEmailParams {
  receivedCount: number;
  targetCount: number;
}

export async function sendRequestLifecycleEmail(
  type: RequestLifecycleEmailType,
  params: BaseEmailParams | VerdictProgressParams
): Promise<void> {
  try {
    const { to, requestId, title, category } = params;
    if (!to) return;

    switch (type) {
      case 'request_created':
        await sendRequestCreatedEmail(to, requestId, category, title);
        break;

      case 'verdict_progress': {
        const vp = params as VerdictProgressParams;
        await sendVerdictProgressEmail(to, requestId, vp.receivedCount, vp.targetCount, title);
        break;
      }

      case 'verdict_completed': {
        const vp = params as VerdictProgressParams;
        await sendVerdictCompletedEmail(to, requestId, vp.targetCount, title);
        break;
      }
    }
  } catch (err) {
    console.error('sendRequestLifecycleEmail error:', err);
  }
}

