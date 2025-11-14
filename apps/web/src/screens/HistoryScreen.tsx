import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

type Entry = {
  id: string;
  ts: string;
  plan_json?: { summary: string; next_step: string };
};

const fetchEntries = async (): Promise<Entry[]> => {
  const { data } = await api.get('/entries?limit=30');
  return data.entries ?? [];
};

export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({ queryKey: ['entries'], queryFn: fetchEntries });

  const handleDelete = async (id: string) => {
    await api.delete(`/entries/${id}`);
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  };

  return (
    <div className="screen">
      <h1>History</h1>
      <div className="timeline">
        {(entriesQuery.data ?? []).map((entry) => (
          <div key={entry.id} className="card">
            <p>{new Date(entry.ts).toLocaleString()}</p>
            <p>{entry.plan_json?.summary ?? 'Entry saved'}</p>
            <button onClick={() => handleDelete(entry.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
