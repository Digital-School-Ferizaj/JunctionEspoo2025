import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useRecorder } from '../hooks/useRecorder';

type BuddyResponse = {
  buddy: {
    id: string;
    since_ts: string;
    partner?: { id: string; name: string };
  } | null;
  messages: {
    id: string;
    transcript: string;
    summary_json?: { summary: string; tone: string; suggestion: string };
    from_user: string;
    ts: string;
  }[];
  streak: number;
  queued?: boolean;
};

const fetchBuddy = async (): Promise<BuddyResponse> => {
  const { data } = await api.get('/buddy');
  return data;
};

export default function BuddyScreen() {
  const queryClient = useQueryClient();
  const buddyQuery = useQuery({ queryKey: ['buddy'], queryFn: fetchBuddy });
  const { isRecording, elapsed, start, stop } = useRecorder(30);
  const [interests, setInterests] = useState('gardening,poetry');
  const [status, setStatus] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const optInMutation = useMutation({
    mutationFn: async () => {
      const payload = { interests: interests.split(',').map((i) => i.trim()) };
      const { data } = await api.post('/buddy/opt-in', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buddy'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post('/buddy/leave'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buddy'] }),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.post('/buddy/block'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buddy'] }),
  });

  const handleStop = async () => {
    const blob = await stop();
    if (!blob) return;
    setStatus('Uploading buddy note…');
    const formData = new FormData();
    formData.append('file', blob, 'buddy.webm');
    formData.append('kind', 'messages');
    const { data } = await api.post('/media/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setAudioUrl(data.audio_url);
    setStatus('Ready to send.');
  };

  const handleSend = async () => {
    if (!audioUrl) return;
    setStatus('Sending buddy note…');
    const { data } = await api.post('/buddy/message', { audio_url: audioUrl });
    const stored = localStorage.getItem('amily-demo-flow');
    const flow = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      'amily-demo-flow',
      JSON.stringify({ ...flow, buddy: data.summary_json, ts: new Date().toISOString() }),
    );
    setAudioUrl('');
    await queryClient.invalidateQueries({ queryKey: ['buddy'] });
    setStatus('Note sent.');
  };

  const data = buddyQuery.data;

  return (
    <div className="screen">
      <h1>Buddy</h1>
      <p>
        {data?.buddy
          ? `Paired since ${new Date(data.buddy.since_ts).toLocaleDateString()}`
          : 'Opt in to find a gentle companion with shared interests.'}
      </p>
      {!data?.buddy && (
        <div className="card">
          <label>
            Interests
            <input value={interests} onChange={(e) => setInterests(e.target.value)} />
          </label>
          <button className="primary-btn" onClick={() => optInMutation.mutate()}>
            Opt-in & pair
          </button>
          {data?.queued && <p>We are matching you now.</p>}
        </div>
      )}
      {data?.buddy && (
        <div className="card">
          <h2>{data.buddy.partner?.name ?? 'Buddy'}</h2>
          <p>Daily streak: {data.streak} day(s)</p>
          <button className="primary-btn" onClick={() => (isRecording ? handleStop() : start())}>
            {isRecording ? `Recording… ${elapsed}s` : 'Send a 20s note'}
          </button>
          {audioUrl && (
            <>
              <p>Audio ready.</p>
              <button className="primary-btn" onClick={handleSend}>
                Send note
              </button>
            </>
          )}
          <button onClick={() => leaveMutation.mutate()}>Leave Buddy</button>
          <button onClick={() => blockMutation.mutate()}>Block buddy</button>
        </div>
      )}
      <section style={{ marginTop: 24 }}>
        <h2>Buddy notes</h2>
        <div className="timeline">
          {(data?.messages ?? []).slice(0, 4).map((message) => (
            <div key={message.id} className="card">
              <p>{message.summary_json?.summary ?? message.transcript}</p>
              <small>{new Date(message.ts).toLocaleString()}</small>
              {message.summary_json && (
                <p>
                  Tone: {message.summary_json.tone} • Suggestion: {message.summary_json.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
      {status && <p>{status}</p>}
    </div>
  );
}
