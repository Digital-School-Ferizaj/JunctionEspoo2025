const { useState, useEffect, useCallback } = React;
const { BuddyIcon } = window.AmilyIcons;

function BuddyTab({ userId = 'demo-user', authToken = null }) {
    const [lastHello, setLastHello] = useState(null);
    const [buddies, setBuddies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBuddies = useCallback(() => {
        const controller = new AbortController();
        const loadProfiles = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (userId) {
                    params.set('excludeUserId', userId);
                }
                const query = params.toString();
                const response = await fetch(`/api/buddies${query ? `?${query}` : ''}`, {
                    headers: {
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                    signal: controller.signal,
                });
                let payload = null;
                try {
                    payload = await response.json();
                } catch {
                    payload = null;
                }
                if (!response.ok || !payload?.success) {
                    throw new Error(payload?.error || 'Unable to load nearby buddies.');
                }
                if (!controller.signal.aborted) {
                    setBuddies(Array.isArray(payload.data) ? payload.data : []);
                }
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                console.warn('Unable to fetch buddy list', fetchError);
                setError(fetchError?.message || 'Unable to load nearby buddies right now.');
                setBuddies([]);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };
        loadProfiles();
        return controller;
    }, [authToken, userId]);

    useEffect(() => {
        const controller = fetchBuddies();
        return () => controller.abort();
    }, [fetchBuddies]);

    return (
        <section className="px-4 py-12 pb-28 bg-[#FFFFF0]">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                        <BuddyIcon />
                        Buddy board
                    </div>
                    <h2 className="text-3xl font-bold">Meet neighbors with similar interests</h2>
                    <p className="text-[#6b6b6b]">Matches stay small and friendly. Elders can wave hello and families can see who is nearby.</p>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="rounded-[32px] border border-dashed border-[#f4d3b4] bg-white/85 p-6 text-center text-sm text-[#6b6b6b]">
                            Gathering nearby friends...
                        </div>
                    ) : error ? (
                        <div className="rounded-[32px] border border-[#f4b0a0] bg-[#fff3f0] p-6 space-y-3 text-sm text-[#a6523b]">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={fetchBuddies}
                                className="px-4 py-2 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md"
                            >
                                Try again
                            </button>
                        </div>
                    ) : buddies.length === 0 ? (
                        <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 p-6 text-sm text-[#6b6b6b]">
                            No other users are visible yet. Check back soon as the circle grows.
                        </div>
                    ) : (
                        buddies.map((buddy) => (
                            <div key={buddy.id} className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-md p-6 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#db7758]">
                                        {buddy.distance || 'Nearby'}
                                    </p>
                                    <h3 className="text-2xl font-bold">{buddy.name}</h3>
                                    <p className="text-sm text-[#6b6b6b]">Available: {buddy.availability || 'Shares schedule privately'}</p>
                                    {buddy.note && <p className="text-sm text-[#6b6b6b] mt-1">{buddy.note}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(buddy.interests || ['Friendly chats']).map((interest) => (
                                        <span key={`${buddy.id || buddy.name}-${interest}`} className="px-4 py-2 rounded-full bg-[#fffaf0] border border-[#f4d3b4] text-sm text-[#545454]">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.BuddyTab = BuddyTab;
