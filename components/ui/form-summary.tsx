'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Image, FileText } from 'lucide-react';

interface FormSummaryProps {
  data: {
    mediaType?: 'photo' | 'text';
    category?: string;
    subcategory?: string;
    content?: string;
    context?: string;
    fileUrl?: string;
    targetVerdictCount?: number;
  };
  onEdit?: (step: number) => void;
  className?: string;
}

export function FormSummary({ data, onEdit, className = '' }: FormSummaryProps) {
  if (!data.mediaType) return null;

  return (
    <Card className={`p-4 bg-gray-50 border-dashed ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Your Request Summary</h3>
        <Badge variant="secondary" className="text-xs">
          {data.targetVerdictCount || 3} verdicts
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Media Type & Content */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {data.mediaType === 'photo' ? (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-blue-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 capitalize">
                {data.mediaType} submission
              </p>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(1)}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {data.fileUrl && data.mediaType === 'photo' && (
              <div className="mt-2">
                <img
                  src={data.fileUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md border"
                />
              </div>
            )}

            {data.content && data.mediaType === 'text' && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                "{data.content}"
              </p>
            )}
          </div>
        </div>

        {/* Category */}
        {data.category && (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm text-gray-900 capitalize">
                  {data.category}
                  {data.subcategory && ` • ${data.subcategory}`}
                </p>
              </div>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(2)}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Context */}
        {data.context && (
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0 mt-1"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Context</p>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(3)}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {data.context}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Edit Actions */}
      {onEdit && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(1)}
              className="text-xs h-7"
            >
              Change content
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(2)}
              className="text-xs h-7"
            >
              Change category
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}