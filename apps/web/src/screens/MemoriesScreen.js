import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useRecorder } from '../hooks/useRecorder';
const fetchMemories = async () => {
    const { data } = await api.get('/memories?limit=100');
    return data.memories ?? [];
};
export default function MemoriesScreen() {
    const queryClient = useQueryClient();
    const memoriesQuery = useQuery({ queryKey: ['memories'], queryFn: fetchMemories });
    const { isRecording, elapsed, start, stop } = useRecorder(60);
    const [transcript, setTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [summary, setSummary] = useState(null);
    const [shareTarget, setShareTarget] = useState('');
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [status, setStatus] = useState('Record a life story to add to MemoryLane.');
    const handleStop = async () => {
        const blob = await stop();
        if (!blob)
            return;
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
        const payload = { transcript };
        if (audioUrl)
            payload.audio_url = audioUrl;
        const { data } = await api.post('/memories', payload);
        setSummary(data.summary_json);
        await queryClient.invalidateQueries({ queryKey: ['memories'] });
        const stored = localStorage.getItem('amily-demo-flow');
        const flow = stored ? JSON.parse(stored) : {};
        localStorage.setItem('amily-demo-flow', JSON.stringify({ ...flow, memory: data.summary_json, ts: new Date().toISOString() }));
        setStatus('Memory added to your timeline.');
        setTranscript('');
    };
    const handleShare = async () => {
        if (!shareTarget || !selectedMemory)
            return;
        await api.post(`/memories/${selectedMemory}/share`, { to_user_id: shareTarget });
        setShareTarget('');
        setSelectedMemory(null);
        alert('Share snippet created and sent via n8n.');
    };
    return (_jsxs("div", { className: "screen", children: [_jsx("h1", { children: "MemoryLane" }), _jsx("p", { children: status }), _jsxs("div", { className: "card", children: [_jsx("button", { className: "primary-btn", onClick: () => (isRecording ? handleStop() : start()), children: isRecording ? `Recording… ${elapsed}s` : 'Record a new memory' }), transcript && (_jsxs(_Fragment, { children: [_jsx("textarea", { value: transcript, onChange: (e) => setTranscript(e.target.value), style: { width: '100%', minHeight: 120, marginTop: 12 } }), _jsx("button", { className: "primary-btn", onClick: handleSaveMemory, children: "Save to MemoryLane" })] })), summary && (_jsxs("div", { style: { marginTop: 16 }, children: [_jsx("h3", { children: summary.title }), _jsx("p", { children: summary.story_3_sentences }), _jsx("blockquote", { children: summary.quote })] }))] }), _jsxs("div", { style: { marginTop: 32 }, children: [_jsx("h2", { children: "Timeline" }), _jsx("div", { className: "timeline", children: (memoriesQuery.data ?? []).map((memory) => (_jsxs("div", { className: "card timeline-card", children: [_jsx("h3", { children: memory.summary_json?.title ?? 'Untitled' }), _jsx("p", { children: memory.summary_json?.era }), _jsx("blockquote", { children: memory.summary_json?.quote }), _jsx("button", { className: "primary-btn", onClick: () => {
                                        setSelectedMemory(memory.id);
                                    }, children: "Share snippet" })] }, memory.id))) })] }), selectedMemory && (_jsxs("div", { className: "card", style: { marginTop: 24 }, children: [_jsx("h3", { children: "Share Memory Snippet" }), _jsxs("label", { children: ["Recipient user ID", _jsx("input", { value: shareTarget, onChange: (e) => setShareTarget(e.target.value) })] }), _jsx("button", { className: "primary-btn", onClick: handleShare, children: "Send via n8n" }), _jsx("button", { onClick: () => setSelectedMemory(null), children: "Cancel" })] }))] }));
}
