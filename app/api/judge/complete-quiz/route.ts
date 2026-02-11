import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

/**
 * SECURE Judge Quiz Completion Endpoint
 *
 * This endpoint handles judge qualification quiz completion.
 * SECURITY MEASURES:
 * 1. Quiz answers are validated SERVER-SIDE (not client-side)
 * 2. is_judge and judge_qualification_date are set atomically
 * 3. Rate limited to prevent brute-force attempts
 * 4. Answers must match expected correct answers exactly
 */

// Quiz questions and correct answers - stored server-side only
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the most important quality of good feedback?',
    correctAnswer: 'honest_and_constructive',
    options: [
      { id: 'always_positive', label: 'Always being positive' },
      { id: 'honest_and_constructive', label: 'Being honest while remaining constructive' },
      { id: 'brief_and_quick', label: 'Being as brief as possible' },
      { id: 'agreeing_with_asker', label: 'Agreeing with what the asker wants to hear' },
    ],
  },
  {
    id: 'q2',
    question: 'How should you handle a request about an uncomfortable topic?',
    correctAnswer: 'professional_boundaries',
    options: [
      { id: 'skip_it', label: 'Skip it without responding' },
      { id: 'professional_boundaries', label: 'Maintain professional boundaries and provide objective feedback' },
      { id: 'harsh_criticism', label: 'Be extra harsh to discourage such topics' },
      { id: 'only_positive', label: 'Only say positive things to avoid conflict' },
    ],
  },
  {
    id: 'q3',
    question: 'What is the expected timeframe to respond to requests?',
    correctAnswer: 'within_24_hours',
    options: [
      { id: 'immediately', label: 'Immediately, within minutes' },
      { id: 'within_24_hours', label: 'Within 24 hours for community, faster for paid' },
      { id: 'whenever_convenient', label: 'Whenever it is convenient for you' },
      { id: 'within_week', label: 'Within a week' },
    ],
  },
  {
    id: 'q4',
    question: 'What should you do if you are unsure about providing feedback on a topic?',
    correctAnswer: 'acknowledge_limits',
    options: [
      { id: 'guess_anyway', label: 'Guess and provide feedback anyway' },
      { id: 'acknowledge_limits', label: 'Acknowledge your limitations and provide what insight you can' },
      { id: 'refuse_entirely', label: 'Refuse to provide any feedback' },
      { id: 'pretend_expert', label: 'Pretend to be an expert on the topic' },
    ],
  },
];

const REQUIRED_CORRECT_ANSWERS = 4; // Must get all correct to pass
const MAX_ATTEMPTS_PER_DAY = 3;

// POST /api/judge/complete-quiz - Submit quiz answers and become a judge if passed
async function POST_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is already a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge, judge_qualification_date')
      .eq('id', user.id)
      .single();

    if (profile?.is_judge) {
      return NextResponse.json({
        error: 'You are already a qualified judge',
      }, { status: 400 });
    }

    // Check daily attempt limit using judge_qualifications table
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: qualification } = await (supabase as any)
      .from('judge_qualifications')
      .select('id, test_attempts, last_attempt_at')
      .eq('user_id', user.id)
      .single();

    if (qualification) {
      const lastAttempt = qualification.last_attempt_at
        ? new Date(qualification.last_attempt_at)
        : null;

      // Reset attempts if last attempt was before today
      const attemptsToday =
        lastAttempt && lastAttempt >= today ? qualification.test_attempts : 0;

      if (attemptsToday >= MAX_ATTEMPTS_PER_DAY) {
        return NextResponse.json({
          error: 'Maximum quiz attempts reached for today. Please try again tomorrow.',
          attempts_remaining: 0,
        }, { status: 429 });
      }
    }

    const body = await request.json();
    const { answers } = body;

    // Validate answers format
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({
        error: 'Invalid answers format',
      }, { status: 400 });
    }

    // Validate all questions are answered
    const missingQuestions = QUIZ_QUESTIONS.filter((q) => !answers[q.id]);
    if (missingQuestions.length > 0) {
      return NextResponse.json({
        error: 'All questions must be answered',
        missing: missingQuestions.map((q) => q.id),
      }, { status: 400 });
    }

    // Grade the quiz
    let correctCount = 0;
    const results: Record<string, boolean> = {};

    for (const question of QUIZ_QUESTIONS) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    }

    const passed = correctCount >= REQUIRED_CORRECT_ANSWERS;

    // Update qualification record with attempt
    const qualificationUpdate = {
      user_id: user.id,
      test_attempts: (qualification?.test_attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      application_status: passed ? 'approved' : 'pending',
    };

    if (qualification) {
      await (supabase as any)
        .from('judge_qualifications')
        .update(qualificationUpdate)
        .eq('id', qualification.id);
    } else {
      await (supabase as any)
        .from('judge_qualifications')
        .insert(qualificationUpdate);
    }

    if (!passed) {
      const attemptsRemaining =
        MAX_ATTEMPTS_PER_DAY - qualificationUpdate.test_attempts;
      return NextResponse.json({
        passed: false,
        score: correctCount,
        total: QUIZ_QUESTIONS.length,
        required: REQUIRED_CORRECT_ANSWERS,
        attempts_remaining: Math.max(0, attemptsRemaining),
        message:
          attemptsRemaining > 0
            ? `You scored ${correctCount}/${QUIZ_QUESTIONS.length}. ${attemptsRemaining} attempts remaining today.`
            : 'Maximum attempts reached for today. Please try again tomorrow.',
      });
    }

    // PASSED - Grant judge status using service client (bypasses RLS)
    const qualificationDate = new Date().toISOString();

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({
        is_judge: true,
        judge_qualification_date: qualificationDate,
        judge_training_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      log.error('Failed to grant judge status', updateError, { userId: user.id });
      return NextResponse.json({
        error: 'Failed to complete qualification. Please contact support.',
      }, { status: 500 });
    }

    // Create success notification
    try {
      await (supabase as any).rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'judge_qualified',
        p_title: 'Congratulations! You are now a Judge',
        p_message: 'You have successfully completed the judge qualification. Start judging to earn credits!',
        p_metadata: JSON.stringify({
          action_label: 'Start Judging',
          action_url: '/judge',
          priority: 'high',
        }),
      });
    } catch {
      // Non-critical - don't fail if notification fails
    }

    log.info('User qualified as judge', {
      userId: user.id,
      qualificationDate,
      score: `${correctCount}/${QUIZ_QUESTIONS.length}`,
    });

    return NextResponse.json({
      passed: true,
      score: correctCount,
      total: QUIZ_QUESTIONS.length,
      message: 'Congratulations! You are now a qualified judge.',
      qualification_date: qualificationDate,
    });
  } catch (error) {
    log.error('POST /api/judge/complete-quiz error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/judge/complete-quiz - Get quiz questions (without correct answers)
async function GET_Handler(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already a judge
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_judge')
      .eq('id', user.id)
      .single();

    if (profile?.is_judge) {
      return NextResponse.json({
        already_qualified: true,
        message: 'You are already a qualified judge',
      });
    }

    // Check attempts remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: qualification } = await (supabase as any)
      .from('judge_qualifications')
      .select('test_attempts, last_attempt_at')
      .eq('user_id', user.id)
      .single();

    let attemptsRemaining = MAX_ATTEMPTS_PER_DAY;
    if (qualification) {
      const lastAttempt = qualification.last_attempt_at
        ? new Date(qualification.last_attempt_at)
        : null;
      const attemptsToday =
        lastAttempt && lastAttempt >= today ? qualification.test_attempts : 0;
      attemptsRemaining = Math.max(0, MAX_ATTEMPTS_PER_DAY - attemptsToday);
    }

    // Return questions WITHOUT correct answers
    const questions = QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      questions,
      attempts_remaining: attemptsRemaining,
      required_correct: REQUIRED_CORRECT_ANSWERS,
      total_questions: QUIZ_QUESTIONS.length,
    });
  } catch (error) {
    log.error('GET /api/judge/complete-quiz error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply strict rate limiting to prevent brute-force attempts
export const POST = withRateLimit(POST_Handler, rateLimitPresets.strict);
export const GET = withRateLimit(GET_Handler, rateLimitPresets.default);
