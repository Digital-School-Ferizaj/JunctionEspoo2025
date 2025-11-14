import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useRecorder } from '../hooks/useRecorder';
const fetchBuddy = async () => {
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
        if (!blob)
            return;
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
        if (!audioUrl)
            return;
        setStatus('Sending buddy note…');
        const { data } = await api.post('/buddy/message', { audio_url: audioUrl });
        const stored = localStorage.getItem('amily-demo-flow');
        const flow = stored ? JSON.parse(stored) : {};
        localStorage.setItem('amily-demo-flow', JSON.stringify({ ...flow, buddy: data.summary_json, ts: new Date().toISOString() }));
        setAudioUrl('');
        await queryClient.invalidateQueries({ queryKey: ['buddy'] });
        setStatus('Note sent.');
    };
    const data = buddyQuery.data;
    return (_jsxs("div", { className: "screen", children: [_jsx("h1", { children: "Buddy" }), _jsx("p", { children: data?.buddy
                    ? `Paired since ${new Date(data.buddy.since_ts).toLocaleDateString()}`
                    : 'Opt in to find a gentle companion with shared interests.' }), !data?.buddy && (_jsxs("div", { className: "card", children: [_jsxs("label", { children: ["Interests", _jsx("input", { value: interests, onChange: (e) => setInterests(e.target.value) })] }), _jsx("button", { className: "primary-btn", onClick: () => optInMutation.mutate(), children: "Opt-in & pair" }), data?.queued && _jsx("p", { children: "We are matching you now." })] })), data?.buddy && (_jsxs("div", { className: "card", children: [_jsx("h2", { children: data.buddy.partner?.name ?? 'Buddy' }), _jsxs("p", { children: ["Daily streak: ", data.streak, " day(s)"] }), _jsx("button", { className: "primary-btn", onClick: () => (isRecording ? handleStop() : start()), children: isRecording ? `Recording… ${elapsed}s` : 'Send a 20s note' }), audioUrl && (_jsxs(_Fragment, { children: [_jsx("p", { children: "Audio ready." }), _jsx("button", { className: "primary-btn", onClick: handleSend, children: "Send note" })] })), _jsx("button", { onClick: () => leaveMutation.mutate(), children: "Leave Buddy" }), _jsx("button", { onClick: () => blockMutation.mutate(), children: "Block buddy" })] })), _jsxs("section", { style: { marginTop: 24 }, children: [_jsx("h2", { children: "Buddy notes" }), _jsx("div", { className: "timeline", children: (data?.messages ?? []).slice(0, 4).map((message) => (_jsxs("div", { className: "card", children: [_jsx("p", { children: message.summary_json?.summary ?? message.transcript }), _jsx("small", { children: new Date(message.ts).toLocaleString() }), message.summary_json && (_jsxs("p", { children: ["Tone: ", message.summary_json.tone, " \u2022 Suggestion: ", message.summary_json.suggestion] }))] }, message.id))) })] }), status && _jsx("p", { children: status })] }));
}
