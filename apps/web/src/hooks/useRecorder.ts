import { useCallback, useEffect, useRef, useState } from 'react';

export function useRecorder(maxSeconds = 60) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    timer.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxSeconds) {
          stop();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isRecording, maxSeconds]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices) {
      setError('Microphone unsupported, please upload audio manually.');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.current = mediaRecorder;
    mediaRecorder.start();
    setElapsed(0);
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    if (!recorder.current) return null;
    return new Promise<Blob>((resolve) => {
      recorder.current!.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        resolve(blob);
        if (timer.current) clearInterval(timer.current);
        setIsRecording(false);
      };
      recorder.current!.stop();
    });
  }, []);

  return {
    isRecording,
    elapsed,
    start,
    stop,
    error,
  };
}
