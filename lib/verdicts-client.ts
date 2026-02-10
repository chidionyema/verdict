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

    // Upload files with comprehensive validation and error handling
    let mediaUrls: string[] = [];
    if (input.files && input.files.length > 0) {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
      const UPLOAD_TIMEOUT = 30000; // 30 seconds
      
      for (const file of input.files) {
        // File validation
        if (file.size > MAX_FILE_SIZE) {
          return { success: false, error: `File "${file.name}" is too large. Maximum size is 10MB.` };
        }
        
        if (!ALLOWED_TYPES.includes(file.type)) {
          return { success: false, error: `File "${file.name}" has unsupported type. Allowed: images and videos.` };
        }
        
        // Sanitize filename to prevent path injection
        const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}.${fileExt}`;
        
        try {
          // Upload with timeout protection
          const uploadPromise = supabase.storage
            .from('verdict-media')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          const { error: uploadError } = await Promise.race([
            uploadPromise,
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout')), UPLOAD_TIMEOUT)
            )
          ]);

          if (uploadError) {
            if (uploadError.message === 'Upload timeout') {
              return { success: false, error: `Upload timeout for "${file.name}". Please check your connection and try again.` };
            }
            return { success: false, error: `Failed to upload "${file.name}": ${uploadError.message}` };
          }

          const { data: urlData } = supabase.storage
            .from('verdict-media')
            .getPublicUrl(fileName);

          mediaUrls.push(urlData.publicUrl);
          
        } catch (error) {
          return { 
            success: false, 
            error: `Upload failed for "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
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
      // Create comparison request - format must match API expectations
      const response = await fetch('/api/comparisons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input.context,
          category: input.category,
          optionA: {
            title: 'Option A',
            description: mediaUrls[0] || input.textContent?.split('\n')[0] || 'First option',
          },
          optionB: {
            title: 'Option B',
            description: mediaUrls[1] || input.textContent?.split('\n')[1] || 'Second option',
          },
          context: {
            timeframe: 'soon',
            importance: 'medium' as const,
            goals: [input.context || 'Get feedback on my decision'],
          },
          requestTier: input.creditsToUse <= 1 ? 'community' : input.creditsToUse <= 2 ? 'standard' : 'pro',
          visibility: 'private',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create comparison' };
      }

      requestId = result.comparisonId;
      
    } else if (input.requestType === 'split_test') {
      // Split tests require exactly 2 photos
      if (!input.files || input.files.length < 2) {
        return {
          success: false,
          error: 'Split tests require exactly 2 photos. Please upload both Photo A and Photo B.'
        };
      }

      // Convert files to base64 for the API
      const fileToBase64 = async (file: File): Promise<{ name: string; type: string; size: number; data: string }> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        const [photoAFile, photoBFile] = await Promise.all([
          fileToBase64(input.files[0]),
          fileToBase64(input.files[1]),
        ]);

        const response = await fetch('/api/split-tests/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: input.category,
            question: input.context,
            context: input.context,
            photoAFile,
            photoBFile,
            visibility: 'public',
            targetVerdicts: input.targetVerdictCount,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          return { success: false, error: result.error || 'Failed to create split test' };
        }

        requestId = result.splitTestId;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process photos for split test'
        };
      }
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