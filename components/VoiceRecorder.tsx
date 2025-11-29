'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play } from 'lucide-react';

interface VoiceRecorderProps {
  onRecorded: (file: File, durationMs: number) => void;
  maxDurationSeconds?: number;
}

export function VoiceRecorder({ onRecorded, maxDurationSeconds = 120 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startTimer = () => {
    if (timerRef.current) return;
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support voice recording. Please use Chrome, Firefox, or Safari.');
      }

      // Check if we're on HTTPS (required for microphone access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Voice recording requires HTTPS. Please access the site securely.');
      }

      // Request microphone permission with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Voice recording is not supported in your browser.');
      }

      // Try webm first, fall back to other formats
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: mimeType || 'audio/webm',
        });
        onRecorded(file, elapsed * 1000);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        stopTimer();
        alert('Recording failed. Please try again.');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error('Error starting recording', err);
      setIsRecording(false);
      stopTimer();
      
      // Provide specific error messages
      let errorMessage = 'Could not access microphone. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please click the microphone icon in your browser\'s address bar and allow microphone access, then try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Microphone settings are not supported. Please try with a different microphone.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'Recording was interrupted. Please try again.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check your browser permissions and try again.';
      }
      
      alert(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    stopTimer();
    setIsRecording(false);
    setElapsed(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    chunksRef.current = [];
  };

  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700">
            <Mic className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">Record a voice note</p>
            <p className="text-xs text-gray-500">
              Up to {Math.floor(maxDurationSeconds / 60)} minutes. Speak clearly in a quiet room.
            </p>
          </div>
        </div>
        <span className="font-mono text-sm text-gray-700">
          {minutes}:{seconds}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Mic className="h-4 w-4" />
            Start recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}

        {audioUrl && !isRecording && (
          <>
            <audio controls src={audioUrl} className="flex-1" />
            <button
              type="button"
              onClick={resetRecording}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Re-record
            </button>
          </>
        )}
      </div>

      {!audioUrl && !isRecording && (
        <p className="text-xs text-gray-500">
          Tip: You can still add a short text summary so others can skim quickly.
        </p>
      )}
    </div>
  );
}



