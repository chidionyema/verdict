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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        onRecorded(file, elapsed * 1000);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Error starting recording', err);
      alert('Could not access microphone. Please check your browser permissions.');
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
          Tip: You can still add a short text summary so judges can skim quickly.
        </p>
      )}
    </div>
  );
}



