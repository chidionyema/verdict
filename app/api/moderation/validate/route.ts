import { NextRequest, NextResponse } from 'next/server';
import { moderateText, moderateImage, moderateRequest } from '@/lib/moderation-free';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// POST /api/moderation/validate - Validate content before submission
async function POST_Handler(request: NextRequest) {
  try {
    const { content, mediaType, filename, fileSize } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Moderate the content
    const moderationResult = moderateRequest(content, mediaType, filename, fileSize);

    // Log the moderation attempt
    log.info('Content moderation check', {
      approved: moderationResult.approved,
      reason: moderationResult.reason,
      confidence: moderationResult.confidence,
      contentLength: content.length,
      mediaType,
      filename: filename ? filename.substring(0, 50) : undefined
    });

    if (!moderationResult.approved) {
      return NextResponse.json({
        approved: false,
        reason: moderationResult.reason,
        suggestion: getSuggestion(moderationResult.reason || '')
      }, { status: 200 });
    }

    return NextResponse.json({
      approved: true,
      confidence: moderationResult.confidence
    }, { status: 200 });

  } catch (error) {
    log.error('Content moderation error', error);
    return NextResponse.json(
      { error: 'Moderation service unavailable' },
      { status: 500 }
    );
  }
}

function getSuggestion(reason: string): string {
  const suggestions: Record<string, string> = {
    'Sexual content not allowed': 'Please keep your request appropriate and family-friendly.',
    'Violent content not allowed': 'Please avoid content related to violence or harm.',
    'Illegal content not allowed': 'Please ensure your content complies with all applicable laws.',
    'Spam content detected': 'Please write a genuine, specific request without promotional language.',
    'Hate speech not allowed': 'Please be respectful and avoid offensive language.',
    'Phone numbers not allowed': 'Please remove personal contact information from your request.',
    'Email addresses not allowed': 'Please remove email addresses from your request.',
    'Content too long (max 2000 characters)': 'Please shorten your request to under 2000 characters.',
    'Content too short (min 10 characters)': 'Please provide more detail about what you want feedback on.',
    'Excessive capitalization (spam indicator)': 'Please use normal capitalization in your request.',
    'Repetitive characters (spam indicator)': 'Please avoid repeating characters unnecessarily.',
    'Excessive punctuation (spam indicator)': 'Please use normal punctuation in your request.',
    'Inappropriate filename': 'Please choose a more appropriate filename for your image.',
    'File type not allowed': 'Please upload a JPG, PNG, GIF, or WebP image.',
    'File too large (max 10MB)': 'Please upload a smaller image (max 10MB).'
  };

  return suggestions[reason] || 'Please review your content and make it more appropriate.';
}

// Apply rate limiting to moderation validation endpoint
export const POST = withRateLimit(POST_Handler, rateLimitPresets.default);