import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, VerdictRequest, VerdictResponse } from './database.types';
import { createClient } from '@/lib/supabase/client';

type DbClient = SupabaseClient<Database>;

// Interface for the submitRequest function used by the create page
export interface SubmitRequestInput {
  requestType: 'verdict' | 'comparison' | 'split_test';
  category: string;
  context: string;
  textContent?: string;
  mediaType: 'photo' | 'text' | 'audio';
  targetVerdictCount: number;
  creditsToUse: number;
  files?: File[];
  specificQuestions?: string[];
  demographicFilters?: any;
}

export interface SubmitRequestResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

/**
 * Client-side function to submit a new request using the create form
 */
export async function submitRequest(input: SubmitRequestInput): Promise<SubmitRequestResult> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'You must be logged in to submit a request' };
    }

    // Upload files if any
    let mediaUrls: string[] = [];
    if (input.files && input.files.length > 0) {
      for (const file of input.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('verdict-media')
          .upload(fileName, file);

        if (uploadError) {
          return { success: false, error: `Failed to upload file: ${uploadError.message}` };
        }

        const { data: urlData } = supabase.storage
          .from('verdict-media')
          .getPublicUrl(fileName);

        mediaUrls.push(urlData.publicUrl);
      }
    }

    // Create the request based on type
    let requestId: string | null = null;

    if (input.requestType === 'verdict') {
      // Create standard verdict request via API
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: input.category,
          media_type: input.mediaType,
          media_url: mediaUrls[0] || null,
          text_content: input.textContent || null,
          context: input.context,
          visibility: 'public',
          requestedTone: 'honest',
          targetVerdictCount: input.targetVerdictCount,
          creditsToCharge: input.creditsToUse,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create request' };
      }
      
      requestId = result.request.id;
      
    } else if (input.requestType === 'comparison') {
      // Create comparison request
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.context,
          description: input.context,
          option_a_title: 'Option A',
          option_a_description: mediaUrls[0] || input.textContent?.split('\n')[0] || '',
          option_b_title: 'Option B', 
          option_b_description: mediaUrls[1] || input.textContent?.split('\n')[1] || '',
          category: input.category,
          required_verdicts: input.targetVerdictCount,
          credits_required: input.creditsToUse,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create comparison' };
      }
      
      requestId = result.data?.id;
      
    } else if (input.requestType === 'split_test') {
      // Create split test
      const response = await fetch('/api/split-tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input.context,
          context: input.context,
          photo_a_url: mediaUrls[0] || '',
          photo_b_url: mediaUrls[1] || '',
          category: input.category,
          required_verdicts: input.targetVerdictCount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create split test' };
      }
      
      requestId = result.split_test?.id;
    }

    if (!requestId) {
      return { success: false, error: 'Failed to create request - no ID returned' };
    }

    return { success: true, requestId };
    
  } catch (error) {
    console.error('Error submitting request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}