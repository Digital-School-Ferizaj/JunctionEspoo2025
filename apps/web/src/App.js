import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import TodayScreen from './screens/TodayScreen';
import MemoriesScreen from './screens/MemoriesScreen';
import BuddyScreen from './screens/BuddyScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import DemoReplayScreen from './screens/DemoReplayScreen';
import { useAuth } from './state/AuthContext';
function AuthGate() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ email: '', passcode: '', name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await login(form.email, form.passcode);
            }
            else {
                await register({ email: form.email, passcode: form.passcode, name: form.name });
            }
        }
        catch (err) {
            setError('Unable to sign in. Please check details.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "screen", style: { maxWidth: 480, marginTop: 80 }, children: [_jsxs("div", { className: "card", children: [_jsx("h1", { children: "amily" }), _jsx("p", { children: "Warm voice-first companion for gentle daily moments." }), _jsxs("form", { onSubmit: handleSubmit, children: [mode === 'register' && (_jsxs("label", { children: [_jsx("span", { children: "Name" }), _jsx("input", { type: "text", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })] })), _jsxs("label", { children: [_jsx("span", { children: "Email" }), _jsx("input", { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })] }), _jsxs("label", { children: [_jsx("span", { children: "4-digit passcode" }), _jsx("input", { type: "password", value: form.passcode, onChange: (e) => setForm({ ...form, passcode: e.target.value }), required: true, maxLength: 12 })] }), error && _jsx("p", { style: { color: '#c43d3d' }, children: error }), _jsx("button", { className: "primary-btn", disabled: loading, type: "submit", children: loading ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account' })] }), _jsx("button", { style: { marginTop: 16, background: 'transparent', border: 'none', color: '#f07c7c' }, onClick: () => setMode(mode === 'login' ? 'register' : 'login'), children: mode === 'login' ? 'Need an account?' : 'Back to sign in' })] }), _jsx("p", { style: { marginTop: 24, textAlign: 'center' }, children: "Wellbeing guidance only; not medical advice." })] }));
}
export default function App() {
    const { user, loading, logout } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "screen", children: _jsx("p", { children: "Loading\u2026" }) }));
    }
    if (!user) {
        return _jsx(AuthGate, {});
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "nav-bar", children: [_jsx("div", { children: _jsx("strong", { children: "amily" }) }), _jsxs("nav", { className: "nav-links", "aria-label": "Primary navigation", children: [_jsx(NavLink, { to: "/", children: "Today" }), _jsx(NavLink, { to: "/memories", children: "MemoryLane" }), _jsx(NavLink, { to: "/buddy", children: "Buddy" }), _jsx(NavLink, { to: "/history", children: "History" }), _jsx(NavLink, { to: "/settings", children: "Settings" }), _jsx(NavLink, { to: "/demo", children: "Demo Replay" })] }), _jsx("button", { style: { border: 'none', background: 'transparent' }, onClick: logout, children: "Log out" })] }), _jsx("main", { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(TodayScreen, {}) }), _jsx(Route, { path: "/memories", element: _jsx(MemoriesScreen, {}) }), _jsx(Route, { path: "/buddy", element: _jsx(BuddyScreen, {}) }), _jsx(Route, { path: "/history", element: _jsx(HistoryScreen, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsScreen, {}) }), _jsx(Route, { path: "/demo", element: _jsx(DemoReplayScreen, {}) })] }) }), _jsxs("footer", { style: { textAlign: 'center', padding: 24 }, children: [_jsx("p", { children: "Sharing is off by default. You control what\u2019s shared and with whom." }), _jsx("p", { children: "Wellbeing guidance only; not medical advice." })] })] }));
}
