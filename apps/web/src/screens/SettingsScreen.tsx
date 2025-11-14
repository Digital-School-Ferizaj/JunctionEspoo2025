import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

type Profile = {
  name?: string;
  interests?: string[];
  consent_peer?: boolean;
  consent_share?: boolean;
};

const fetchProfile = async (): Promise<Profile> => {
  const { data } = await api.get('/me');
  return data;
};

export default function SettingsScreen() {
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const [interestsInput, setInterestsInput] = useState('');

  const updateProfile = async (payload: Partial<Profile>) => {
    await api.patch('/me', payload);
    await profileQuery.refetch();
  };

  const handleExport = async (format: 'json' | 'txt') => {
    const res = await api.get(`/export/memories.${format}`, {
      responseType: format === 'txt' ? 'text' : 'json',
    });
    const content = format === 'txt' ? (res.data as string) : JSON.stringify(res.data, null, 2);
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

  if (!profile) return <div className="screen">Loading…</div>;

  return (
    <div className="screen">
      <h1>Settings</h1>
      <div className="card">
        <label>
          Interests
          <input value={interestsInput} onChange={(e) => setInterestsInput(e.target.value)} />
        </label>
        <button onClick={() => updateProfile({ interests: interestsInput.split(',').map((i) => i.trim()) })}>
          Save interests
        </button>
        <label>
          <input
            type="checkbox"
            checked={Boolean(profile.consent_peer)}
            onChange={(e) => updateProfile({ consent_peer: e.target.checked })}
          />
          Buddy opt-in
        </label>
        <label>
          <input
            type="checkbox"
            checked={Boolean(profile.consent_share)}
            onChange={(e) => updateProfile({ consent_share: e.target.checked })}
          />
          Sharing toggle
        </label>
        <button onClick={() => updateProfile({ consent_share: false })}>Pause all sharing</button>
        <div style={{ marginTop: 24 }}>
          <button className="primary-btn" onClick={() => handleExport('json')}>
            Export memories JSON
          </button>
          <button onClick={() => handleExport('txt')}>Export memories TXT</button>
        </div>
        <p style={{ marginTop: 16 }}>Privacy note: Sharing is off by default. You control what’s shared and with whom.</p>
        <p>Disclaimer: Wellbeing guidance only; not medical advice.</p>
      </div>
    </div>
  );
}
