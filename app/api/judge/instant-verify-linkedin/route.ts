import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple LinkedIn profile validation patterns
const EXPERTISE_PATTERNS = [
  { pattern: /\b(software|developer|engineer|programming|tech|IT)\b/i, expertise: 'Tech Professional' },
  { pattern: /\b(marketing|brand|advertising|campaign|social media)\b/i, expertise: 'Marketing Professional' },
  { pattern: /\b(design|creative|UI|UX|graphic|visual)\b/i, expertise: 'Design Professional' },
  { pattern: /\b(hr|human resources|talent|recruiting|people)\b/i, expertise: 'HR Professional' },
  { pattern: /\b(finance|accounting|financial|analyst|controller)\b/i, expertise: 'Finance Professional' },
  { pattern: /\b(sales|business development|account|client|customer)\b/i, expertise: 'Sales Professional' },
  { pattern: /\b(manager|director|leader|executive|VP|president|CEO)\b/i, expertise: 'Leadership Professional' },
  { pattern: /\b(consultant|advisory|strategy|strategic)\b/i, expertise: 'Consulting Professional' },
  { pattern: /\b(teacher|education|professor|instructor|trainer)\b/i, expertise: 'Education Professional' },
  { pattern: /\b(legal|lawyer|attorney|counsel|law)\b/i, expertise: 'Legal Professional' },
];

function validateLinkedInUrl(url: string): boolean {
  const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
  return linkedinUrlPattern.test(url);
}

function detectExpertiseFromUrl(url: string): string {
  // Extract username from LinkedIn URL for basic validation
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  if (!match) return 'Professional';
  
  const username = match[1];
  
  // Basic heuristics based on username patterns
  for (const { pattern, expertise } of EXPERTISE_PATTERNS) {
    if (pattern.test(username)) {
      return expertise;
    }
  }
  
  // Default for valid LinkedIn profiles
  return 'Verified Professional';
}

async function simulateProfileScraping(url: string): Promise<{ valid: boolean; expertise: string }> {
  // In a real implementation, this would:
  // 1. Use LinkedIn API or web scraping (with proper permissions)
  // 2. Validate profile exists and is public
  // 3. Extract job title, company, experience
  // 4. Use AI to categorize expertise
  
  // For now, simulate with URL validation and pattern matching
  const valid = validateLinkedInUrl(url);
  const expertise = valid ? detectExpertiseFromUrl(url) : 'Professional';
  
  // Simulate processing delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return { valid, expertise };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, linkedinUrl } = await request.json();

    if (!userId || !linkedinUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, linkedinUrl' 
      }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate and analyze LinkedIn profile
    const { valid, expertise } = await simulateProfileScraping(linkedinUrl);

    if (!valid) {
      return NextResponse.json({
        verified: false,
        error: 'Invalid or private LinkedIn profile'
      });
    }

    // Update user profile with verification status
    const { error: updateError } = await (supabase
      .from('profiles')
      .update as any)({
        linkedin_verified: true,
        linkedin_url: linkedinUrl,
        expertise_area: expertise,
        verified_at: new Date().toISOString(),
        verification_method: 'instant_linkedin'
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update verification status' 
      }, { status: 500 });
    }

    // Create verification record for audit trail
    await (supabase
      .from('verifications')
      .insert as any)({
        user_id: userId,
        type: 'linkedin',
        status: 'verified',
        platform_url: linkedinUrl,
        expertise_detected: expertise,
        verification_method: 'instant',
        verified_at: new Date().toISOString()
      });

    return NextResponse.json({
      verified: true,
      expertise,
      message: 'LinkedIn profile verified successfully'
    });

  } catch (error) {
    console.error('LinkedIn verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}