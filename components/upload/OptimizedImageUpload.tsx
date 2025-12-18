'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, RotateCcw, AlertCircle, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface OptimizedImageUploadProps {
  onUpload: (file: File, optimizedFile: File, preview: string) => void;
  maxSizeMB?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number;
  acceptedTypes?: string[];
  className?: string;
  placeholder?: string;
}

interface UploadState {
  status: 'idle' | 'processing' | 'success' | 'error';
  originalFile: File | null;
  optimizedFile: File | null;
  preview: string | null;
  error: string | null;
  progress: number;
  compressionStats?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  };
}

export function OptimizedImageUpload({
  onUpload,
  maxSizeMB = 5,
  maxWidthPx = 1920,
  maxHeightPx = 1920,
  quality = 0.85,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  placeholder = 'Drop image here or click to browse'
}: OptimizedImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    originalFile: null,
    optimizedFile: null,
    preview: null,
    error: null,
    progress: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check if it's actually an image
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }

    return null;
  };

  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new globalThis.Image();
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        // Scale down if needed
        if (width > maxWidthPx || height > maxHeightPx) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidthPx;
            height = width / aspectRatio;
          } else {
            height = maxHeightPx;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [maxWidthPx, maxHeightPx, quality]);

  const processFile = async (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      status: 'processing', 
      progress: 0, 
      error: null 
    }));

    try {
      // Step 1: Validation
      setUploadState(prev => ({ ...prev, progress: 20 }));
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Step 2: Create preview
      setUploadState(prev => ({ ...prev, progress: 40 }));
      const preview = URL.createObjectURL(file);

      // Step 3: Compress image
      setUploadState(prev => ({ ...prev, progress: 60 }));
      const optimizedFile = await compressImage(file);

      // Step 4: Calculate stats
      setUploadState(prev => ({ ...prev, progress: 80 }));
      const compressionStats = {
        originalSize: file.size,
        optimizedSize: optimizedFile.size,
        compressionRatio: ((file.size - optimizedFile.size) / file.size) * 100
      };

      // Step 5: Complete
      setUploadState({
        status: 'success',
        originalFile: file,
        optimizedFile,
        preview,
        error: null,
        progress: 100,
        compressionStats
      });

      onUpload(file, optimizedFile, preview);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        progress: 0
      }));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetUpload = () => {
    if (uploadState.preview) {
      URL.revokeObjectURL(uploadState.preview);
    }
    setUploadState({
      status: 'idle',
      originalFile: null,
      optimizedFile: null,
      preview: null,
      error: null,
      progress: 0
    });
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {uploadState.status === 'idle' && (
        /* Upload Area */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
        >
          <Upload className="h-12 w-12 text-gray-400 group-hover:text-indigo-500 mb-4 transition-colors" />
          <p className="text-gray-600 font-medium text-center mb-2">{placeholder}</p>
          <p className="text-sm text-gray-500 text-center px-4">
            Supports JPEG, PNG, WebP up to {maxSizeMB}MB
          </p>
          <p className="text-xs text-gray-400 text-center mt-2">
            Auto-optimized for best quality and performance
          </p>
        </div>
      )}

      {uploadState.status === 'processing' && (
        /* Processing State */
        <div className="border-2 border-indigo-200 rounded-xl aspect-square flex flex-col items-center justify-center bg-indigo-50">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-indigo-800 font-medium mb-2">Optimizing image...</p>
          
          {/* Progress Bar */}
          <div className="w-32 bg-indigo-200 rounded-full h-2 mb-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          
          <p className="text-sm text-indigo-600">{uploadState.progress}%</p>
        </div>
      )}

      {uploadState.status === 'success' && uploadState.preview && (
        /* Success State */
        <div className="relative border-2 border-green-200 rounded-xl overflow-hidden group">
          <div className="aspect-square relative bg-gray-100">
            <Image
              src={uploadState.preview}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
          </div>

          {/* Success Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Replace
              </button>
              <button
                onClick={resetUpload}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </button>
            </div>
          </div>

          {/* Success Indicator */}
          <div className="absolute top-3 left-3 bg-green-500 text-white p-2 rounded-full">
            <CheckCircle className="h-4 w-4" />
          </div>

          {/* Compression Stats */}
          {uploadState.compressionStats && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
              <div className="flex justify-between items-center">
                <span>
                  {formatFileSize(uploadState.compressionStats.originalSize)} → {formatFileSize(uploadState.compressionStats.optimizedSize)}
                </span>
                <span className="text-green-400">
                  -{uploadState.compressionStats.compressionRatio.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadState.status === 'error' && (
        /* Error State */
        <div className="border-2 border-red-200 rounded-xl aspect-square flex flex-col items-center justify-center bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <p className="text-red-800 font-medium text-center mb-4 px-4">
            {uploadState.error}
          </p>
          <button
            onClick={resetUpload}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}