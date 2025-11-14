import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PlanCard from '../components/PlanCard';
import UtopiaMeter from '../components/UtopiaMeter';
import { api } from '../api/client';
import { useRecorder } from '../hooks/useRecorder';

type Entry = {
  id: string;
  ts: string;
  plan_json?: { summary: string; next_step: string; mood: string; tags: string[] };
  mood?: string;
};

const fetchEntries = async (): Promise<Entry[]> => {
  const { data } = await api.get('/entries?limit=10');
  return data.entries ?? [];
};

export default function TodayScreen() {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({ queryKey: ['entries'], queryFn: fetchEntries });
  const { isRecording, elapsed, start, stop, error } = useRecorder(60);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [plan, setPlan] = useState<Entry['plan_json'] | null>(null);
  const [status, setStatus] = useState('A quiet day—ready for a small step?');
  const [planAudioUrl, setPlanAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const streak = useMemo(() => {
    if (!entriesQuery.data) return 0;
    const today = new Date().toDateString();
    return entriesQuery.data.filter((entry) => new Date(entry.ts).toDateString() === today).length;
  }, [entriesQuery.data]);

  const handleStop = async () => {
    const blob = await stop();
    if (!blob) return;
    setStatus('Uploading audio…');
    const formData = new FormData();
    formData.append('file', blob, 'checkin.webm');
    formData.append('kind', 'entries');
    const { data } = await api.post('/media/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    setAudioUrl(data.audio_url);
    setStatus('Transcribing with ElevenLabs…');
    const stt = await api.post('/ai/stt', { audio_url: data.audio_url });
    setTranscript(stt.data.transcript);
    setStatus('Transcript ready — edit if needed, then save.');
  };

  const handleSaveEntry = async () => {
    if (!transcript) return;
    setSaving(true);
    setStatus('Preparing your three-bullet plan…');
    const payload: Record<string, unknown> = { transcript };
    if (audioUrl) payload.audio_url = audioUrl;
    const { data } = await api.post('/entries', payload);
    setPlan(data.plan_json);
    const stored = localStorage.getItem('amily-demo-flow');
    const flow = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      'amily-demo-flow',
      JSON.stringify({ ...flow, transcript, plan: data.plan_json, ts: new Date().toISOString() }),
    );
    await queryClient.invalidateQueries({ queryKey: ['entries'] });
    setSaving(false);
    setStatus('Plan ready.');
  };

  const handlePlayPlan = async () => {
    if (!plan) return;
    const text = `${plan.summary}. Next: ${plan.next_step}. Mood ${plan.mood}.`;
    const { data } = await api.post('/ai/tts', { text });
    setPlanAudioUrl(data.signed_url);
  };

  const entries = entriesQuery.data ?? [];
  const latestMood =
    plan?.mood ??
    entries.find((entry) => entry.mood)?.mood ??
    (entries.length > 0 ? 'ok' : 'good');

  return (
    <div className="screen">
      <h1>Today</h1>
      <p>{status}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          className="primary-btn"
          onClick={() => (isRecording ? handleStop() : start())}
          aria-pressed={isRecording}
        >
          {isRecording ? `Recording… ${elapsed}s` : 'Start today’s check-in'}
        </button>
        {error && <p style={{ color: '#c43d3d' }}>{error}</p>}
        {isRecording && <progress aria-label="Recording progress" max={60} value={elapsed} />}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <progress aria-label="Upload progress" max={100} value={uploadProgress} />
        )}
        {transcript && (
          <div className="card">
            <label htmlFor="transcript">Transcript</label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ width: '100%', minHeight: 120, fontSize: '1rem' }}
            />
            <button className="primary-btn" onClick={handleSaveEntry} disabled={saving}>
              {saving ? 'Saving…' : 'Save check-in'}
            </button>
          </div>
        )}
        {plan && (
          <>
            <PlanCard summary={plan.summary} next={plan.next_step} mood={plan.mood} tags={plan.tags} />
            <button className="primary-btn" onClick={handlePlayPlan}>
              Play Plan (TTS)
            </button>
            {planAudioUrl && <audio controls src={planAudioUrl} />}
          </>
        )}
        <UtopiaMeter streak={streak} social={plan?.tags?.length ?? 1} activity={latestMood === 'good' ? 3 : 1} />
      </div>
    </div>
  );
}
