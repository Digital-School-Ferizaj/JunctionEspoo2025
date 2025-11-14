import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useRecorder } from '../hooks/useRecorder';

type Memory = {
  id: string;
  ts: string;
  summary_json?: {
    title: string;
    era: string;
    story_3_sentences: string;
    tags: string[];
    quote: string;
  };
};

const fetchMemories = async (): Promise<Memory[]> => {
  const { data } = await api.get('/memories?limit=100');
  return data.memories ?? [];
};

export default function MemoriesScreen() {
  const queryClient = useQueryClient();
  const memoriesQuery = useQuery({ queryKey: ['memories'], queryFn: fetchMemories });
  const { isRecording, elapsed, start, stop } = useRecorder(60);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [summary, setSummary] = useState<Memory['summary_json'] | null>(null);
  const [shareTarget, setShareTarget] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [status, setStatus] = useState('Record a life story to add to MemoryLane.');

  const handleStop = async () => {
    const blob = await stop();
    if (!blob) return;
    setStatus('Uploading story…');
    const formData = new FormData();
    formData.append('file', blob, 'memory.webm');
    formData.append('kind', 'memories');
    const { data } = await api.post('/media/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setAudioUrl(data.audio_url);
    setStatus('Transcribing…');
    const stt = await api.post('/ai/stt', { audio_url: data.audio_url });
    setTranscript(stt.data.transcript);
    setStatus('Transcript ready — refine before saving.');
  };

  const handleSaveMemory = async () => {
    const payload: Record<string, unknown> = { transcript };
    if (audioUrl) payload.audio_url = audioUrl;
    const { data } = await api.post('/memories', payload);
    setSummary(data.summary_json);
    await queryClient.invalidateQueries({ queryKey: ['memories'] });
    const stored = localStorage.getItem('amily-demo-flow');
    const flow = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      'amily-demo-flow',
      JSON.stringify({ ...flow, memory: data.summary_json, ts: new Date().toISOString() }),
    );
    setStatus('Memory added to your timeline.');
    setTranscript('');
  };

  const handleShare = async () => {
    if (!shareTarget || !selectedMemory) return;
    await api.post(`/memories/${selectedMemory}/share`, { to_user_id: shareTarget });
    setShareTarget('');
    setSelectedMemory(null);
    alert('Share snippet created and sent via n8n.');
  };

  return (
    <div className="screen">
      <h1>MemoryLane</h1>
      <p>{status}</p>
      <div className="card">
        <button className="primary-btn" onClick={() => (isRecording ? handleStop() : start())}>
          {isRecording ? `Recording… ${elapsed}s` : 'Record a new memory'}
        </button>
        {transcript && (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ width: '100%', minHeight: 120, marginTop: 12 }}
            />
            <button className="primary-btn" onClick={handleSaveMemory}>
              Save to MemoryLane
            </button>
          </>
        )}
        {summary && (
          <div style={{ marginTop: 16 }}>
            <h3>{summary.title}</h3>
            <p>{summary.story_3_sentences}</p>
            <blockquote>{summary.quote}</blockquote>
          </div>
        )}
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Timeline</h2>
        <div className="timeline">
          {(memoriesQuery.data ?? []).map((memory) => (
            <div key={memory.id} className="card timeline-card">
              <h3>{memory.summary_json?.title ?? 'Untitled'}</h3>
              <p>{memory.summary_json?.era}</p>
              <blockquote>{memory.summary_json?.quote}</blockquote>
              <button
                className="primary-btn"
                onClick={() => {
                  setSelectedMemory(memory.id);
                }}
              >
                Share snippet
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedMemory && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Share Memory Snippet</h3>
          <label>
            Recipient user ID
            <input value={shareTarget} onChange={(e) => setShareTarget(e.target.value)} />
          </label>
          <button className="primary-btn" onClick={handleShare}>
            Send via n8n
          </button>
          <button onClick={() => setSelectedMemory(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
