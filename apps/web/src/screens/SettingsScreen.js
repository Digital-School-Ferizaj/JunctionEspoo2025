import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
const fetchProfile = async () => {
    const { data } = await api.get('/me');
    return data;
};
export default function SettingsScreen() {
    const profileQuery = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
    const [interestsInput, setInterestsInput] = useState('');
    const updateProfile = async (payload) => {
        await api.patch('/me', payload);
        await profileQuery.refetch();
    };
    const handleExport = async (format) => {
        const res = await api.get(`/export/memories.${format}`, {
            responseType: format === 'txt' ? 'text' : 'json',
        });
        const content = format === 'txt' ? res.data : JSON.stringify(res.data, null, 2);
        const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `memories.${format}`;
        link.click();
    };
    const profile = profileQuery.data;
    useEffect(() => {
        if (profile?.interests) {
            setInterestsInput(profile.interests.join(', '));
        }
    }, [profile?.interests]);
    if (!profile)
        return _jsx("div", { className: "screen", children: "Loading\u2026" });
    return (_jsxs("div", { className: "screen", children: [_jsx("h1", { children: "Settings" }), _jsxs("div", { className: "card", children: [_jsxs("label", { children: ["Interests", _jsx("input", { value: interestsInput, onChange: (e) => setInterestsInput(e.target.value) })] }), _jsx("button", { onClick: () => updateProfile({ interests: interestsInput.split(',').map((i) => i.trim()) }), children: "Save interests" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: Boolean(profile.consent_peer), onChange: (e) => updateProfile({ consent_peer: e.target.checked }) }), "Buddy opt-in"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: Boolean(profile.consent_share), onChange: (e) => updateProfile({ consent_share: e.target.checked }) }), "Sharing toggle"] }), _jsx("button", { onClick: () => updateProfile({ consent_share: false }), children: "Pause all sharing" }), _jsxs("div", { style: { marginTop: 24 }, children: [_jsx("button", { className: "primary-btn", onClick: () => handleExport('json'), children: "Export memories JSON" }), _jsx("button", { onClick: () => handleExport('txt'), children: "Export memories TXT" })] }), _jsx("p", { style: { marginTop: 16 }, children: "Privacy note: Sharing is off by default. You control what\u2019s shared and with whom." }), _jsx("p", { children: "Disclaimer: Wellbeing guidance only; not medical advice." })] })] }));
}
