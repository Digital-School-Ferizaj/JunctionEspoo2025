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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', passcode: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.passcode);
      } else {
        await register({ email: form.email, passcode: form.passcode, name: form.name });
      }
    } catch (err) {
      setError('Unable to sign in. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{ maxWidth: 480, marginTop: 80 }}>
      <div className="card">
        <h1>amily</h1>
        <p>Warm voice-first companion for gentle daily moments.</p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            <span>4-digit passcode</span>
            <input
              type="password"
              value={form.passcode}
              onChange={(e) => setForm({ ...form, passcode: e.target.value })}
              required
              maxLength={12}
            />
          </label>
          {error && <p style={{ color: '#c43d3d' }}>{error}</p>}
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          style={{ marginTop: 16, background: 'transparent', border: 'none', color: '#f07c7c' }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account?' : 'Back to sign in'}
        </button>
      </div>
      <p style={{ marginTop: 24, textAlign: 'center' }}>Wellbeing guidance only; not medical advice.</p>
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="screen">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className="app-shell">
      <header className="nav-bar">
        <div>
          <strong>amily</strong>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/">Today</NavLink>
          <NavLink to="/memories">MemoryLane</NavLink>
          <NavLink to="/buddy">Buddy</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/demo">Demo Replay</NavLink>
        </nav>
        <button style={{ border: 'none', background: 'transparent' }} onClick={logout}>
          Log out
        </button>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/memories" element={<MemoriesScreen />} />
          <Route path="/buddy" element={<BuddyScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/demo" element={<DemoReplayScreen />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: 24 }}>
        <p>Sharing is off by default. You control what’s shared and with whom.</p>
        <p>Wellbeing guidance only; not medical advice.</p>
      </footer>
    </div>
  );
}
