/**
 * AI-Powered Content Moderation
 * 
 * Uses OpenAI's moderation API for advanced content analysis
 * Falls back to rule-based moderation if AI service is unavailable
 */

import { moderateText, moderateImage, ModerationResult } from '@/lib/moderation-free';
import { log } from '@/lib/logger';
import { metrics } from '@/lib/monitoring/sentry';

interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: Array<{
    categories: {
      hate: boolean;
      'hate/threatening': boolean;
      harassment: boolean;
      'harassment/threatening': boolean;
      'self-harm': boolean;
      'self-harm/intent': boolean;
      'self-harm/instructions': boolean;
      sexual: boolean;
      'sexual/minors': boolean;
      violence: boolean;
      'violence/graphic': boolean;
    };
    category_scores: {
      hate: number;
      'hate/threatening': number;
      harassment: number;
      'harassment/threatening': number;
      'self-harm': number;
      'self-harm/intent': number;
      'self-harm/instructions': number;
      sexual: number;
      'sexual/minors': number;
      violence: number;
      'violence/graphic': number;
    };
    flagged: boolean;
  }>;
}

interface ImageModerationResult {
  approved: boolean;
  reason?: string;
  confidence: number;
  categories?: string[];
  scores?: Record<string, number>;
}

/**
 * Moderate text content using OpenAI's moderation API
 */
export async function moderateTextWithAI(text: string): Promise<ModerationResult> {
  const startTime = Date.now();
  
  try {
    // Quick validation
    if (!text || text.trim().length === 0) {
      return { approved: false, reason: 'Empty content not allowed', confidence: 1.0 };
    }

    if (text.length > 4000) {
      return { approved: false, reason: 'Content too long for AI analysis', confidence: 1.0 };
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      log.warn('OpenAI API key not configured, falling back to rule-based moderation');
      return moderateText(text);
    }

    // Call OpenAI moderation API
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-moderation-stable',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenAIModerationResponse = await response.json();
    const result = data.results[0];
    
    const processingTime = Date.now() - startTime;
    metrics.trackAPICall('openai_moderation', processingTime, response.status);

    if (result.flagged) {
      // Determine the most likely violation
      const violations = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);
      
      const primaryViolation = violations[0] || 'policy_violation';
      const confidence = Math.max(...Object.values(result.category_scores));
      
      log.info('AI moderation flagged content', {
        violations,
        primaryViolation,
        confidence,
        contentLength: text.length,
      });

      return {
        approved: false,
        reason: `Content violates community guidelines: ${primaryViolation.replace(/[/_]/g, ' ')}`,
        confidence: Math.min(confidence + 0.1, 1.0), // Boost confidence slightly for AI
      };
    }

    // Content approved by AI
    return {
      approved: true,
      confidence: 0.95, // High confidence in AI approval
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log.error('AI moderation failed, falling back to rule-based', error);
    metrics.trackErrorRecovery('ai_moderation_fallback', true);
    
    // Fall back to rule-based moderation
    return moderateText(text);
  }
}

/**
 * Moderate image using AI vision models
 */
export async function moderateImageWithAI(imageUrl: string, filename?: string, fileSize?: number): Promise<ImageModerationResult> {
  const startTime = Date.now();
  
  try {
    // First do basic file validation
    if (filename && fileSize) {
      const basicCheck = moderateImage(filename, fileSize);
      if (!basicCheck.approved) {
        return {
          approved: false,
          reason: basicCheck.reason,
          confidence: basicCheck.confidence,
        };
      }
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      log.warn('OpenAI API key not configured for image moderation');
      return {
        approved: true,
        confidence: 0.5, // Low confidence without AI analysis
        reason: 'No AI moderation available',
      };
    }

    // Use GPT-4 Vision for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator. Analyze this image and respond with a JSON object:
            {
              "approved": boolean,
              "reason": string (if not approved),
              "categories": array of violated categories,
              "confidence": number between 0-1,
              "description": brief description of image content
            }
            
            Reject images containing:
            - Nudity or sexual content
            - Violence or graphic content  
            - Hate symbols or offensive imagery
            - Personal information (IDs, documents, etc.)
            - Spam or promotional content
            - Illegal activities
            
            Approve appropriate images for seeking life advice/feedback.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please moderate this image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low' // Faster and cheaper analysis
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    const processingTime = Date.now() - startTime;
    metrics.trackAPICall('openai_vision', processingTime, response.status);

    try {
      // Try to parse JSON response
      const result = JSON.parse(content);
      
      log.info('AI image moderation completed', {
        approved: result.approved,
        categories: result.categories,
        confidence: result.confidence,
        description: result.description?.substring(0, 100),
      });

      return {
        approved: result.approved,
        reason: result.reason,
        confidence: result.confidence || 0.8,
        categories: result.categories,
      };
      
    } catch (parseError) {
      log.error('Failed to parse AI moderation response', parseError, { content });
      throw new Error('Invalid AI response format');
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log.error('AI image moderation failed', error);
    metrics.trackErrorRecovery('ai_image_moderation_fallback', false);
    
    // For images, we're more conservative - reject if we can't analyze
    return {
      approved: false,
      reason: 'Unable to verify image content safety',
      confidence: 0.6,
    };
  }
}

/**
 * Comprehensive moderation combining AI and rule-based approaches
 */
export async function moderateContentWithAI(
  text: string, 
  imageUrl?: string, 
  filename?: string, 
  fileSize?: number
): Promise<ModerationResult> {
  const startTime = Date.now();
  
  try {
    // Always moderate text
    const textResult = await moderateTextWithAI(text);
    if (!textResult.approved) {
      return textResult;
    }

    // Moderate image if provided
    if (imageUrl) {
      const imageResult = await moderateImageWithAI(imageUrl, filename, fileSize);
      if (!imageResult.approved) {
        return {
          approved: false,
          reason: imageResult.reason || 'Image content not approved',
          confidence: imageResult.confidence,
        };
      }
    }

    const totalTime = Date.now() - startTime;
    log.info('AI content moderation completed', {
      textApproved: textResult.approved,
      imageChecked: !!imageUrl,
      totalTimeMs: totalTime,
    });

    return {
      approved: true,
      confidence: Math.min(textResult.confidence, 0.95),
    };

  } catch (error) {
    log.error('AI content moderation failed completely', error);
    
    // Final fallback to rule-based moderation
    return moderateText(text);
  }
}

/**
 * Batch moderation for multiple content items
 */
export async function batchModerateContent(items: Array<{
  id: string;
  text: string;
  imageUrl?: string;
}>): Promise<Array<{
  id: string;
  result: ModerationResult;
}>> {
  const results = await Promise.allSettled(
    items.map(async (item) => ({
      id: item.id,
      result: await moderateContentWithAI(item.text, item.imageUrl),
    }))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      log.error('Batch moderation item failed', result.reason, { itemId: items[index].id });
      return {
        id: items[index].id,
        result: { approved: false, reason: 'Moderation failed', confidence: 0.5 },
      };
    }
  });
}