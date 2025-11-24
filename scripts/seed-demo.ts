/**
 * Demo Seeding Script for VERDICT
 *
 * Run with: npx tsx scripts/seed-demo.ts
 *
 * This script populates the demo database with:
 * - 10 fake seeker profiles
 * - 10 fake judge profiles
 * - 20 verdict requests
 * - 100-200 verdict responses
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample data
const categories = ['appearance', 'profile', 'writing', 'decision'] as const;
const subcategories: Record<string, string[]> = {
  appearance: ['date', 'interview', 'event', 'casual'],
  profile: ['linkedin', 'resume', 'dating'],
  writing: ['email', 'message', 'content'],
  decision: ['purchase', 'career', 'life'],
};

const contexts = {
  appearance: [
    'Going on a first date tonight, want to make a good impression',
    'Job interview at a tech company tomorrow morning',
    'Wedding guest outfit - is this appropriate?',
    'Casual Friday at work - does this look too casual?',
    'Meeting my partner\'s parents for the first time',
  ],
  profile: [
    'Updating my LinkedIn after a promotion',
    'Resume for senior software engineer positions',
    'Dating app profile - trying to attract serious relationships',
    'Professional headshot options for company website',
  ],
  writing: [
    'Email to boss asking for a raise',
    'Text to ex - is this too much?',
    'Cover letter for dream job application',
    'LinkedIn message to recruiter',
  ],
  decision: [
    'Should I buy this $2000 couch?',
    'Thinking about switching careers to tech',
    'Considering moving to a new city for work',
    'Should I accept this job offer?',
  ],
};

const feedbackTemplates = {
  positive: [
    'This looks great! You\'ve clearly put thought into this. The overall presentation is professional and polished.',
    'Really solid choice. I think this will work well for what you\'re going for. Confident and approachable.',
    'Excellent work! This stands out in a good way. You should feel confident about this.',
    'Love this! It\'s authentic and shows your personality while still being appropriate for the context.',
    'This is perfect for the situation. Clean, professional, and memorable in a positive way.',
  ],
  constructive: [
    'Good foundation but could use some refinement. Consider adjusting the details to better match your goal.',
    'Solid start! A few tweaks would really elevate this. Pay attention to the finer details.',
    'Not bad, but I think you can do better. The concept is right but execution needs work.',
    'Decent effort but consider your audience more. What works for one context might not work for another.',
    'Almost there! With a few adjustments this could go from good to great. Focus on the details.',
  ],
  negative: [
    'I\'d recommend reconsidering this approach. It doesn\'t quite hit the mark for your stated goal.',
    'This needs significant work. The current version might not achieve what you\'re hoping for.',
    'Honestly, I think you should try a different direction. This isn\'t quite landing right.',
    'The intention is good but the execution needs improvement. Start fresh with the feedback in mind.',
    'I\'d suggest getting more input before proceeding. This might not give you the result you want.',
  ],
};

const ageRanges = ['18-24', '25-34', '35-44', '45+'] as const;
const genders = ['male', 'female', 'nonbinary'] as const;
const tones = ['honest', 'constructive', 'encouraging'] as const;

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('Starting demo seeding...');

  // Create fake profiles (we'll create them with auth.admin.createUser)
  const seekerIds: string[] = [];
  const judgeIds: string[] = [];

  // Create seekers
  console.log('Creating seeker profiles...');
  for (let i = 1; i <= 10; i++) {
    const email = `seeker${i}@demo.verdict.app`;

    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUsers) {
      seekerIds.push(existingUsers.id);
      continue;
    }

    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: { full_name: `Demo Seeker ${i}` },
    });

    if (error) {
      console.error(`Error creating seeker ${i}:`, error.message);
      continue;
    }

    if (user.user) {
      seekerIds.push(user.user.id);

      // Update profile with random demographics
      await supabase
        .from('profiles')
        .update({
          age_range: randomChoice(ageRanges),
          gender: randomChoice(genders),
          credits: randomInt(0, 10),
        })
        .eq('id', user.user.id);
    }
  }

  // Create judges
  console.log('Creating judge profiles...');
  for (let i = 1; i <= 10; i++) {
    const email = `judge${i}@demo.verdict.app`;

    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUsers) {
      judgeIds.push(existingUsers.id);
      continue;
    }

    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: { full_name: `Demo Judge ${i}` },
    });

    if (error) {
      console.error(`Error creating judge ${i}:`, error.message);
      continue;
    }

    if (user.user) {
      judgeIds.push(user.user.id);

      await supabase
        .from('profiles')
        .update({
          is_judge: true,
          age_range: randomChoice(ageRanges),
          gender: randomChoice(genders),
        })
        .eq('id', user.user.id);
    }
  }

  console.log(`Created ${seekerIds.length} seekers and ${judgeIds.length} judges`);

  // Create verdict requests
  console.log('Creating verdict requests...');
  const requestIds: string[] = [];

  for (let i = 0; i < 20; i++) {
    const category = randomChoice(categories);
    const subcategory = randomChoice(subcategories[category]);
    const context = randomChoice(contexts[category]);
    const userId = randomChoice(seekerIds);
    const isCompleted = i < 15; // 15 completed, 5 open

    const { data: request, error } = await supabase
      .from('verdict_requests')
      .insert({
        user_id: userId,
        category,
        subcategory,
        media_type: 'text',
        text_content: `This is demo content for a ${category} request about ${subcategory}.`,
        context,
        status: isCompleted ? 'closed' : 'open',
        target_verdict_count: 3, // Reduced to 3 for 40%+ profit margin
        received_verdict_count: isCompleted ? 3 : randomInt(0, 2),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating request:', error.message);
      continue;
    }

    if (request) {
      requestIds.push(request.id);
    }
  }

  console.log(`Created ${requestIds.length} verdict requests`);

  // Create verdict responses
  console.log('Creating verdict responses...');
  let responseCount = 0;

  for (const requestId of requestIds) {
    // Get request details
    const { data: request } = await supabase
      .from('verdict_requests')
      .select('received_verdict_count, status')
      .eq('id', requestId)
      .single();

    if (!request) continue;

    const numVerdicts = request.status === 'closed' ? 3 : request.received_verdict_count;
    const usedJudges = new Set<string>();

    for (let i = 0; i < numVerdicts; i++) {
      // Pick a judge that hasn't been used for this request
      let judgeId: string;
      do {
        judgeId = randomChoice(judgeIds);
      } while (usedJudges.has(judgeId) && usedJudges.size < judgeIds.length);
      usedJudges.add(judgeId);

      // Determine feedback type (70% positive, 20% constructive, 10% negative)
      const rand = Math.random();
      let feedbackType: 'positive' | 'constructive' | 'negative';
      if (rand < 0.7) feedbackType = 'positive';
      else if (rand < 0.9) feedbackType = 'constructive';
      else feedbackType = 'negative';

      const feedback = randomChoice(feedbackTemplates[feedbackType]);
      const rating = feedbackType === 'positive'
        ? randomInt(7, 10)
        : feedbackType === 'constructive'
        ? randomInt(5, 7)
        : randomInt(3, 5);

      const { error } = await supabase
        .from('verdict_responses')
        .insert({
          request_id: requestId,
          judge_id: judgeId,
          rating,
          feedback,
          tone: randomChoice(tones),
        });

      if (!error) {
        responseCount++;
      }
    }
  }

  console.log(`Created ${responseCount} verdict responses`);
  console.log('Demo seeding complete!');
}

seed().catch(console.error);
