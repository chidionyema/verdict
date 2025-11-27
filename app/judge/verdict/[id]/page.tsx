'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Clock, DollarSign, Send, ArrowLeft } from 'lucide-react';
import { ResponseTemplates } from '@/components/judge/ResponseTemplates';
import { VoiceRecorder } from '@/components/VoiceRecorder';

export default function VerdictSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const availableRequests = useStore((state) => state.availableRequests);
  const claimRequest = useStore((state) => state.claimRequest);

  const [rating, setRating] = useState(7);
  const [advice, setAdvice] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [tone, setTone] = useState<'honest' | 'constructive' | 'encouraging'>(
    'constructive'
  );
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(true);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

  const request = availableRequests.find((r) => r.id === id);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const totalLength = advice.length + reasoning.length;

  const calculateEarnings = () => {
    let base = 0.5;
    const speedBonus = timeRemaining > 60 ? 0.25 : 0;
    const qualityBonus = totalLength > 300 ? 0.15 : 0;
    return (base + speedBonus + qualityBonus).toFixed(2);
  };

  const handleSubmit = async () => {
    if (advice.length < 50) {
      alert('Please provide at least 50 characters in your advice section');
      return;
    }
    if (reasoning.length < 20) {
      alert('Please provide at least 20 characters explaining your reasoning');
      return;
    }

    setSubmitting(true);

    try {
      // Combine advice and reasoning for storage
      const combinedFeedback = `${advice}\n\nReasoning: ${reasoning}`;

      // Optional voice upload
      let uploadedVoiceUrl: string | null = null;
      if (voiceFile) {
        const formData = new FormData();
        formData.append('file', voiceFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          alert(data.error || 'Failed to upload voice note');
          setSubmitting(false);
          return;
        }

        const uploadData = await uploadRes.json();
        uploadedVoiceUrl = uploadData.url;
      }

      // Submit verdict to API
      const response = await fetch('/api/judge/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: id,
          rating: rating,
          feedback: combinedFeedback,
          tone: tone,
          voice_url: uploadedVoiceUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to submit verdict');
        setSubmitting(false);
        return;
      }

      // Success - remove from available requests and redirect
      claimRequest(id);
      router.push('/judge/dashboard?success=true');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit verdict. Please try again.');
      setSubmitting(false);
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Request not found or already claimed</p>
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/judge/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Clock
                className={`h-5 w-5 mr-2 ${
                  timeRemaining < 30 ? 'text-red-500' : 'text-gray-400'
                }`}
              />
              <span
                className={`font-mono ${
                  timeRemaining < 30 ? 'text-red-500' : 'text-gray-700'
                }`}
              >
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-1 text-green-500" />
              <span className="font-semibold text-green-600">
                ${calculateEarnings()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-4">Submission to Review</h3>
            {request.mediaType === 'image' ? (
              <img
                src={request.mediaUrl}
                alt="Submission"
                className="w-full rounded-lg"
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
                <p className="text-gray-700">{request.mediaUrl}</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Category:</strong> {request.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Context:</strong> {request.context}
              </p>
            </div>
          </div>

          {/* Verdict Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-semibold mb-6">Your Verdict</h3>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating: {rating}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Tone
              </label>
              <div className="flex space-x-2">
                {(['honest', 'constructive', 'encouraging'] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        tone === t
                          ? t === 'honest'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : t === 'constructive'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                            : 'bg-green-100 text-green-700 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Example (shown once) */}
            {showExample && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-800">
                    💡 Example of good advice:
                  </p>
                  <button
                    onClick={() => setShowExample(false)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-sm text-blue-700 space-y-2">
                  <div>
                    <strong>Advice:</strong> "I would take the startup job. Early in your career, the learning and growth opportunities matter more than salary security."
                  </div>
                  <div>
                    <strong>Reasoning:</strong> "I made a similar choice 5 years ago and the experience accelerated my career significantly. The equity could also pay off long-term."
                  </div>
                </div>
              </div>
            )}

            {/* Response Templates */}
            <ResponseTemplates
              category={request.category}
              onInsert={(text) => setAdvice(advice + text)}
              className="mb-6"
            />

            {/* Advice Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your advice: What would you do and why?
              </label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Share your perspective on what decision you would make and your main reasoning..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
              <p
                className={`text-sm mt-1 ${
                  advice.length < 50 ? 'text-red-500' : advice.length > 200 ? 'text-green-600' : 'text-blue-600'
                }`}
              >
                {advice.length}/500 characters {advice.length < 50 ? '(min 50)' : advice.length > 200 ? '✓ Great detail' : '✓ Good start'}
              </p>
            </div>

            {/* Reasoning Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your reasoning: Based on my experience...
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain why based on your personal experience, observations, or expertise..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <p
                className={`text-sm mt-1 ${
                  reasoning.length < 20 ? 'text-red-500' : reasoning.length > 100 ? 'text-green-600' : 'text-blue-600'
                }`}
              >
                {reasoning.length}/300 characters {reasoning.length < 20 ? '(min 20)' : reasoning.length > 100 ? '✓ Excellent' : '✓'}
              </p>
            </div>

            {/* Optional voice note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional voice note response
              </label>
              <VoiceRecorder
                onRecorded={(file) => {
                  setVoiceFile(file);
                  if (voiceUrl) {
                    URL.revokeObjectURL(voiceUrl);
                  }
                  const url = URL.createObjectURL(file);
                  setVoiceUrl(url);
                }}
                maxDurationSeconds={180}
              />
              {voiceUrl && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-800 mb-1">
                    Your voice note preview
                  </p>
                  <audio controls src={voiceUrl} className="w-full" />
                </div>
              )}
            </div>

            {/* Earnings Preview */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Estimated earnings:</strong> ${calculateEarnings()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Base: $0.50 + Speed bonus:{' '}
                {timeRemaining > 60 ? '$0.25' : '$0.00'} + Quality bonus:{' '}
                {totalLength > 300 ? '$0.15' : '$0.00'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                💡 More detail = better help (and possibly better ratings!)
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={advice.length < 50 || reasoning.length < 20 || submitting}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center cursor-pointer ${
                advice.length < 50 || reasoning.length < 20 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Verdict
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
