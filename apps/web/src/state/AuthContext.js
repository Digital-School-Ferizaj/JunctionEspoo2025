import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { api, setAuthToken } from '../api/client';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setTokenState] = useState(null);
    const [loading, setLoading] = useState(true);
    const persist = (nextToken, profile) => {
        if (nextToken && profile) {
            localStorage.setItem('amily-session', JSON.stringify({ token: nextToken, user: profile }));
        }
        else {
            localStorage.removeItem('amily-session');
        }
    };
    const logout = useCallback(() => {
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
        persist(null, null);
    }, []);
    useEffect(() => {
        const stored = localStorage.getItem('amily-session');
        if (stored) {
            const parsed = JSON.parse(stored);
            setTokenState(parsed.token);
            setAuthToken(parsed.token);
            setUser(parsed.user);
        }
        setLoading(false);
    }, []);
    useEffect(() => {
        if (!token)
            return;
        (async () => {
            try {
                const { data } = await api.get('/me');
                setUser(data);
                persist(token, data);
            }
            catch {
                logout();
            }
        })();
    }, [token, logout]);
    const login = async (email, passcode) => {
        const { data } = await api.post('/auth/login', { email, passcode });
        setAuthToken(data.token);
        setTokenState(data.token);
        setUser(data.user);
        persist(data.token, data.user);
    };
    const register = async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        setAuthToken(data.token);
        setTokenState(data.token);
        setUser(data.user);
        persist(data.token, data.user);
    };
    const value = useMemo(() => ({
        user,
        token,
        loading,
        login,
        register,
        logout,
    }), [user, token, loading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('AuthContext missing');
    return ctx;
}
