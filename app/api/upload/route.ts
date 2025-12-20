import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { v4 as uuidv4 } from 'uuid';
import { log } from '@/lib/logger';
import { withRateLimit, rateLimitPresets } from '@/lib/api/with-rate-limit';

// File upload security configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

// POST /api/upload - Upload image to Supabase Storage
const POST_Handler = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for uploads
    const rateLimitCheck = await checkRateLimit(uploadRateLimiter, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitCheck.retryAfter?.toString() || '60' }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Security Layer 1: File size validation
    if (file.size > MAX_FILE_SIZE) {
      log.warn('File size exceeded', { 
        userId: user.id, 
        fileSize: file.size, 
        fileName: file.name,
        maxSize: MAX_FILE_SIZE 
      });
      return NextResponse.json({ 
        error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 413 });
    }

    // Security Layer 2: MIME type validation
    const imageTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    const audioTypes = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
    const allowedTypes = [...imageTypes, ...audioTypes];
    
    if (!allowedTypes.includes(file.type)) {
      log.warn('Invalid file type uploaded', { 
        userId: user.id, 
        fileType: file.type, 
        fileName: file.name 
      });
      return NextResponse.json(
        { error: 'Only JPEG, PNG, HEIC, WebP images or supported audio (webm, mp3, mp4, ogg) are allowed' },
        { status: 400 }
      );
    }

    // Security Layer 3: File extension validation (prevent bypass)
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'heic', 'webp', 'webm', 'mp3', 'mp4', 'ogg'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      log.warn('Invalid file extension', { 
        userId: user.id, 
        fileName: file.name, 
        extension: fileExtension 
      });
      return NextResponse.json({ 
        error: 'Invalid file extension' 
      }, { status: 400 });
    }

    // Security Layer 4: File name sanitization
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
      .substring(0, 100); // Limit name length

    // Validate file size (with different limits for audio vs images)
    const isAudio = audioTypes.includes(file.type);
    const maxSize = isAudio ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB audio, 5MB image
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isAudio ? 'Audio must be 10MB or smaller' : 'Image must be 5MB or smaller' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}/${uuidv4()}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('requests')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      log.error('Upload error', uploadError);

      // Storage bucket not configured
      if (
        uploadError.message?.includes('The resource was not found') ||
        uploadError.message?.includes('Bucket not found')
      ) {
        return NextResponse.json(
          {
            error: 'Storage not configured',
            details: 'The storage bucket "requests" does not exist. Please create it in Supabase Dashboard.',
          },
          { status: 503 }
        );
      }

      // RLS policy violation
      if (
        uploadError.message?.includes('row-level security policy') ||
        uploadError.message?.includes('violates') ||
        uploadError.message?.includes('permission denied')
      ) {
        return NextResponse.json(
          {
            error: 'Storage permissions not configured',
            details: 'Please set up storage bucket policies in Supabase Dashboard.',
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('requests').getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    log.error('POST /api/upload error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit(POST_Handler, rateLimitPresets.upload);
