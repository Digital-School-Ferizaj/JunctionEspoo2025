import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
const fetchEntries = async () => {
    const { data } = await api.get('/entries?limit=30');
    return data.entries ?? [];
};
export default function HistoryScreen() {
    const queryClient = useQueryClient();
    const entriesQuery = useQuery({ queryKey: ['entries'], queryFn: fetchEntries });
    const handleDelete = async (id) => {
        await api.delete(`/entries/${id}`);
        queryClient.invalidateQueries({ queryKey: ['entries'] });
    };
    return (_jsxs("div", { className: "screen", children: [_jsx("h1", { children: "History" }), _jsx("div", { className: "timeline", children: (entriesQuery.data ?? []).map((entry) => (_jsxs("div", { className: "card", children: [_jsx("p", { children: new Date(entry.ts).toLocaleString() }), _jsx("p", { children: entry.plan_json?.summary ?? 'Entry saved' }), _jsx("button", { onClick: () => handleDelete(entry.id), children: "Delete" })] }, entry.id))) })] }));
}
