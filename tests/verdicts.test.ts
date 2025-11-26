import { describe, it, expect } from 'vitest';
import { createVerdictRequest, addJudgeVerdict } from '@/lib/verdicts';

function createSupabaseMock(overrides: any = {}) {
  const base = {
    from: () => base,
    select: () => base,
    eq: () => base,
    single: () => Promise.resolve({ data: null, error: null }),
    insert: () => base,
    update: () => base,
    rpc: () => Promise.resolve({ data: null, error: null }),
  };

  return Object.assign(base, overrides);
}

describe('createVerdictRequest', () => {
  it('throws INSUFFICIENT_CREDITS when deduct_credits fails', async () => {
    const supabase = createSupabaseMock({
      // profiles.select().single() → no existing profile (so it will insert one)
      single: vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // initial profile fetch
        .mockResolvedValueOnce({ data: { id: 'user-1', credits: 3 }, error: null }), // after insert
      insert: vi.fn().mockReturnThis(),
      rpc: vi
        .fn()
        // deduct_credits
        .mockResolvedValueOnce({
          data: [{ success: false, message: 'Not enough credits' }],
          error: null,
        }),
    });

    let caught: any = null;
    try {
      await createVerdictRequest(supabase as any, {
        userId: 'user-1',
        email: 'test@example.com',
        category: 'decision' as any,
        media_type: 'text' as any,
        context: 'Test',
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeTruthy();
    expect(caught.code).toBe('INSUFFICIENT_CREDITS');
  });

  it('calls refund_credits when request insert fails', async () => {
    const rpc = vi
      .fn()
      // deduct_credits
      .mockResolvedValueOnce({
        data: [{ success: true }],
        error: null,
      })
      // refund_credits
      .mockResolvedValueOnce({
        data: null,
        error: null,
      });

    const supabase = createSupabaseMock({
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-1', credits: 3 },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      }),
      rpc,
    });

    let caught: any = null;
    try {
      await createVerdictRequest(supabase as any, {
        userId: 'user-1',
        email: 'test@example.com',
        category: 'decision' as any,
        media_type: 'text' as any,
        context: 'Test',
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith('refund_credits', {
      p_user_id: 'user-1',
      p_credits: 1,
      p_reason: 'Request creation failed',
    });
  });
});

describe('addJudgeVerdict', () => {
  it('prevents judging own request with CANNOT_JUDGE_OWN_REQUEST', async () => {
    const supabase = createSupabaseMock({
      // first .from('verdict_requests').select().eq().single()
      single: vi.fn().mockResolvedValue({
        data: { id: 'req-1', user_id: 'judge-1', status: 'in_progress' },
        error: null,
      }),
    });

    let caught: any = null;
    try {
      await addJudgeVerdict(supabase as any, {
        requestId: 'req-1',
        judgeId: 'judge-1',
        rating: 9,
        feedback: 'Test',
        tone: 'honest' as any,
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeTruthy();
    expect(caught.code).toBe('CANNOT_JUDGE_OWN_REQUEST');
  });
});


