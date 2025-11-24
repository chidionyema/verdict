// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const moderationConfigSchema = z.object({
  provider: z.enum(['openai', 'perspective', 'aws-comprehend']),
  api_key: z.string().min(1),
  thresholds: z.object({
    toxicity: z.number().min(0).max(1).default(0.7),
    severe_toxicity: z.number().min(0).max(1).default(0.5),
    identity_attack: z.number().min(0).max(1).default(0.7),
    insult: z.number().min(0).max(1).default(0.7),
    threat: z.number().min(0).max(1).default(0.5),
    profanity: z.number().min(0).max(1).default(0.8),
  }),
  auto_action: z.enum(['flag', 'block', 'review']).default('flag'),
  is_active: z.boolean().default(true),
});

const moderateContentSchema = z.object({
  content: z.string().min(1),
  content_type: z.enum(['request', 'response', 'comment']),
  content_id: z.string(),
  user_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null; error: any };

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'ai_moderation')
      .single();

    // Don't expose API keys in response
    if (config?.config) {
      const sanitizedConfig = { ...config };
      sanitizedConfig.config = {
        ...sanitizedConfig.config,
        api_key: sanitizedConfig.config.api_key ? '***hidden***' : null,
      };
      return NextResponse.json({ config: sanitizedConfig });
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error('AI moderation config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null; error: any };

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = moderationConfigSchema.parse(body);

    // Test the AI moderation configuration
    const testResult = await testModerationConfig(validated);
    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'AI moderation configuration test failed', 
        details: testResult.error 
      }, { status: 400 });
    }

    // Save or update AI moderation configuration
    const { data: config, error } = await supabase
      .from('integration_configs')
      .upsert({
        integration_type: 'ai_moderation',
        config: {
          provider: validated.provider,
          api_key: validated.api_key,
          thresholds: validated.thresholds,
          auto_action: validated.auto_action,
        },
        is_active: validated.is_active,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving AI moderation config:', error);
      return NextResponse.json({ error: 'Failed to save AI moderation configuration' }, { status: 500 });
    }

    return NextResponse.json({ config, message: 'AI moderation integration configured successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid AI moderation configuration', details: error.errors }, { status: 400 });
    }

    console.error('AI moderation config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Moderate content endpoint
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const body = await request.json();
    const validated = moderateContentSchema.parse(body);

    // Get AI moderation configuration
    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_type', 'ai_moderation')
      .eq('is_active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'AI moderation not configured' }, { status: 404 });
    }

    const moderationConfig = config.config as any;
    
    // Perform moderation
    const result = await moderateContent(moderationConfig, validated.content);
    
    if (!result.success) {
      console.error('Failed to moderate content:', result.error);
      return NextResponse.json({ error: 'Failed to moderate content' }, { status: 500 });
    }

    // Store moderation result
    const { error: insertError } = await supabase
      .from('content_moderation_logs')
      .insert({
        content_type: validated.content_type,
        content_id: validated.content_id,
        user_id: validated.user_id,
        moderation_result: result.result,
        action_taken: result.actionTaken,
        provider: moderationConfig.provider,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing moderation result:', insertError);
    }

    return NextResponse.json({
      success: true,
      result: result.result,
      action_taken: result.actionTaken,
      requires_review: result.requiresReview,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid moderation data', details: error.errors }, { status: 400 });
    }

    console.error('Content moderation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function testModerationConfig(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Test with a sample text
    const testText = "This is a test message for moderation.";
    
    switch (config.provider) {
      case 'openai':
        return await testOpenAIModeration(config.api_key, testText);
      case 'perspective':
        return await testPerspectiveAPI(config.api_key, testText);
      case 'aws-comprehend':
        return await testAWSComprehend(config.api_key, testText);
      default:
        return { success: false, error: 'Unsupported moderation provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testOpenAIModeration(apiKey: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `OpenAI API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testPerspectiveAPI(apiKey: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Perspective API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testAWSComprehend(apiKey: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    // AWS Comprehend test would require AWS SDK
    // For now, just validate the API key format
    if (apiKey.length < 20) {
      return { success: false, error: 'Invalid AWS credentials' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function moderateContent(config: any, content: string): Promise<{ 
  success: boolean; 
  error?: string; 
  result?: any; 
  actionTaken?: string; 
  requiresReview?: boolean;
}> {
  try {
    switch (config.provider) {
      case 'openai':
        return await moderateWithOpenAI(config, content);
      case 'perspective':
        return await moderateWithPerspective(config, content);
      case 'aws-comprehend':
        return await moderateWithAWSComprehend(config, content);
      default:
        return { success: false, error: 'Unsupported moderation provider' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function moderateWithOpenAI(config: any, content: string): Promise<{ 
  success: boolean; 
  error?: string; 
  result?: any; 
  actionTaken?: string; 
  requiresReview?: boolean;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `OpenAI error: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    const result = data.results[0];
    
    // Determine action based on configuration
    let actionTaken = 'none';
    let requiresReview = false;
    
    if (result.flagged) {
      switch (config.auto_action) {
        case 'block':
          actionTaken = 'blocked';
          break;
        case 'review':
          actionTaken = 'flagged_for_review';
          requiresReview = true;
          break;
        default:
          actionTaken = 'flagged';
          break;
      }
    }

    return {
      success: true,
      result,
      actionTaken,
      requiresReview,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function moderateWithPerspective(config: any, content: string): Promise<{ 
  success: boolean; 
  error?: string; 
  result?: any; 
  actionTaken?: string; 
  requiresReview?: boolean;
}> {
  try {
    const response = await fetch(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${config.api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text: content },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Perspective API error: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    const scores = data.attributeScores;
    
    // Check against thresholds
    let flagged = false;
    const thresholds = config.thresholds;
    
    if (scores.TOXICITY?.scores?.PROBABILITY >= thresholds.toxicity) flagged = true;
    if (scores.SEVERE_TOXICITY?.scores?.PROBABILITY >= thresholds.severe_toxicity) flagged = true;
    if (scores.IDENTITY_ATTACK?.scores?.PROBABILITY >= thresholds.identity_attack) flagged = true;
    if (scores.INSULT?.scores?.PROBABILITY >= thresholds.insult) flagged = true;
    if (scores.PROFANITY?.scores?.PROBABILITY >= thresholds.profanity) flagged = true;
    if (scores.THREAT?.scores?.PROBABILITY >= thresholds.threat) flagged = true;
    
    // Determine action based on configuration
    let actionTaken = 'none';
    let requiresReview = false;
    
    if (flagged) {
      switch (config.auto_action) {
        case 'block':
          actionTaken = 'blocked';
          break;
        case 'review':
          actionTaken = 'flagged_for_review';
          requiresReview = true;
          break;
        default:
          actionTaken = 'flagged';
          break;
      }
    }

    return {
      success: true,
      result: { flagged, scores },
      actionTaken,
      requiresReview,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function moderateWithAWSComprehend(config: any, content: string): Promise<{ 
  success: boolean; 
  error?: string; 
  result?: any; 
  actionTaken?: string; 
  requiresReview?: boolean;
}> {
  // AWS Comprehend implementation would require AWS SDK
  return { success: false, error: 'AWS Comprehend integration not implemented' };
}