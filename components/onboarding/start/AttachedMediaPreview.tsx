'use client';

interface AttachedMediaPreviewProps {
  mediaType: 'photo' | 'text';
  previewUrl: string | null;
  textContent: string;
  onChangeUpload: () => void;
}

export function AttachedMediaPreview({
  mediaType,
  previewUrl,
  textContent,
  onChangeUpload,
}: AttachedMediaPreviewProps) {
  if (!previewUrl && !textContent) return null;

  return (
    <div className="max-w-3xl mx-auto mb-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-indigo-600 mb-1">
            Your upload
          </p>
          <p className="text-sm text-gray-700">
            {mediaType === 'photo'
              ? 'Photo attached – judges will see this on your request.'
              : 'Text attached – judges will read this as your main content.'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {mediaType === 'photo' && previewUrl && (
            <img
              src={previewUrl}
              alt="Your upload"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
            />
          )}
          {mediaType === 'text' && textContent && (
            <div className="hidden sm:block max-w-xs text-xs text-gray-600 line-clamp-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
              {textContent}
            </div>
          )}
          <button
            type="button"
            onClick={onChangeUpload}
            className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          >
            Change upload
          </button>
        </div>
      </div>
    </div>
  );
}
