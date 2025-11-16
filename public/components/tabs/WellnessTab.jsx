const { useState, useEffect, useCallback } = React;
const { ActivityIcon, WellnessLeafIcon } = window.AmilyIcons;

const resolveTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
};

const priorityToStatus = {
    high: 'low',
    medium: 'notice',
    low: 'ok',
};

const formatNudgeLabel = (type) => {
    switch (type) {
        case 'medication':
            return 'Medication';
        case 'hydration':
            return 'Hydration';
        case 'activity':
            return 'Movement';
        case 'weather':
            return 'Weather care';
        case 'rest':
            return 'Rest';
        default:
            return 'Daily note';
    }
};

const getMoodSnapshot = (status, current, goal) => {
    if (status === 'ok') {
        return {
            value: 'Calm & steady',
            tip: `Already ${current} of ${goal} glasses logged today.`,
            status: 'ok',
        };
    }
    if (status === 'notice') {
        return {
            value: 'Energy dipping a little',
            tip: `Only ${current} of ${goal} glasses so far. A small glass would help.`,
            status: 'notice',
        };
    }
    return {
        value: 'Needs a pause',
        tip: `Hydration still at ${current} / ${goal}. Let's sip water before the next activity.`,
        status: 'low',
    };
};

const formatTimestamp = (value) => {
    if (!value) return null;
    try {
        return new Date(value).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return null;
    }
};

function WellnessTab({ userId = 'demo-user', authToken = null }) {
    const profile = {
        name: 'Evelyn Parker',
        age: 78,
        city: 'Espoo',
        note: 'Prefers afternoon chats and short morning walks whenever the paths are dry.',
    };

    const wellnessStore = window.AmilyWellness;
    const getHydrationSnapshot = () => ({
        goal: wellnessStore?.getDailyGoal?.() ?? 6,
        current: wellnessStore?.getHydration?.() ?? 0,
        lastDrink: wellnessStore?.getLastDrink?.() ?? null,
    });
    const [hydration, setHydration] = useState(getHydrationSnapshot);
    const [nudges, setNudges] = useState([]);
    const [isFetchingNudges, setIsFetchingNudges] = useState(false);
    const [nudgesError, setNudgesError] = useState(null);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        if (wellnessStore?.setUser) {
            wellnessStore.setUser(userId || 'demo-user');
        }
        setHydration(getHydrationSnapshot());
    }, [userId]);

    useEffect(() => {
        const handleUpdate = (event) => {
            const detail = event.detail || {};
            if (detail.userId && detail.userId !== (userId || 'demo-user')) {
                return;
            }
            setHydration((prev) => ({
                goal: detail.dailyGoal ?? prev.goal,
                current: detail.hydration ?? prev.current,
                lastDrink: detail.lastDrink ?? prev.lastDrink,
            }));
        };
        window.addEventListener('amily:hydration:update', handleUpdate);
        return () => window.removeEventListener('amily:hydration:update', handleUpdate);
    }, [userId]);

    const hydrationPercent = Math.min(
        100,
        Math.round(((hydration.current || 0) / (hydration.goal || 1)) * 100)
    );
    const glassesRemaining = Math.max(0, (hydration.goal || 0) - (hydration.current || 0));
    const hydrationStatus =
        hydration.current >= hydration.goal
            ? 'ok'
            : hydration.current <= 2
            ? 'low'
            : 'notice';
    const moodSnapshot = getMoodSnapshot(hydrationStatus, hydration.current || 0, hydration.goal || 0);
    const timeOfDay = resolveTimeOfDay();
    const moodParam = hydrationStatus === 'ok' ? 'good' : hydrationStatus === 'notice' ? 'ok' : 'low';

    const fetchWellnessNudges = useCallback(
        async ({ signal } = {}) => {
            if (typeof window === 'undefined') return;
            const activeUserId = wellnessStore?.getActiveUserId?.() || userId || 'demo-user';
            setIsFetchingNudges(true);
            setNudgesError(null);
            try {
                const params = new URLSearchParams({
                    userId: activeUserId,
                    timeOfDay,
                    mood: moodParam,
                });
                const response = await fetch(`/api/wellness/nudges?${params.toString()}`, {
                    headers: {
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                    signal,
                });
                let payload = null;
                try {
                    payload = await response.json();
                } catch {
                    payload = null;
                }
                if (!response.ok || !payload?.success) {
                    throw new Error(payload?.error || 'Unable to load suggestions right now.');
                }
                if (signal?.aborted) return;
                const list = Array.isArray(payload.data) ? payload.data : [];
                setNudges(list);
                setLastSync(payload.timestamp || new Date().toISOString());
            } catch (error) {
                if (signal?.aborted) return;
                console.warn('Unable to load wellness nudges', error);
                setNudges([]);
                setNudgesError(error?.message || 'Unable to load suggestions.');
            } finally {
                if (!signal?.aborted) {
                    setIsFetchingNudges(false);
                }
            }
        },
        [authToken, moodParam, timeOfDay, userId]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchWellnessNudges({ signal: controller.signal });
        return () => controller.abort();
    }, [fetchWellnessNudges]);

    const logHydrationToServer = (amount = 1) => {
        fetch('/api/wellness/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
                userId: userId || 'demo-user',
                type: 'water',
                value: amount,
            }),
        }).catch(() => {
            // Non-blocking demo mode
        });
    };

    const handleManualHydration = () => {
        wellnessStore?.setUser?.(userId || 'demo-user');
        wellnessStore?.adjustHydration?.(1);
        logHydrationToServer(1);
    };

    const handleRefreshNudges = () => {
        fetchWellnessNudges();
    };

    const lastDrinkLabel = formatTimestamp(hydration.lastDrink);
    const lastSyncLabel = formatTimestamp(lastSync);

    const hydrationNudge = nudges.find((nudge) => nudge.type === 'hydration');
    const medicationNudge = nudges.find((nudge) => nudge.type === 'medication');
    const activityNudge = nudges.find((nudge) => nudge.type === 'activity');
    const weatherNudge = nudges.find((nudge) => nudge.type === 'weather');

    const hydrationTip =
        hydrationNudge?.message ||
        (hydration.current >= hydration.goal
            ? 'Goal met – sip warm tea if you like.'
            : glassesRemaining === 1
            ? 'Just one more gentle glass.'
            : `${glassesRemaining} more to feel refreshed.`);

    const wellnessAreas = [
        {
            label: 'Mood today',
            value: moodSnapshot.value,
            status: moodSnapshot.status,
            tip: moodSnapshot.tip,
        },
        {
            label: 'Hydration',
            value: `${hydration.current} of ${hydration.goal} glasses`,
            status: hydrationStatus,
            tip: hydrationTip,
        },
        medicationNudge
            ? {
                  label: 'Medication',
                  value: medicationNudge.message,
                  status: priorityToStatus[medicationNudge.priority] || 'notice',
                  tip: medicationNudge.action ? `Suggested action: ${medicationNudge.action}` : null,
              }
            : null,
        activityNudge
            ? {
                  label: 'Movement',
                  value: activityNudge.message,
                  status: priorityToStatus[activityNudge.priority] || 'notice',
                  tip: activityNudge.action ? `Suggested action: ${activityNudge.action}` : 'Walk near the window for sunlight.',
              }
            : null,
        weatherNudge
            ? {
                  label: 'Weather care',
                  value: weatherNudge.message,
                  status: priorityToStatus[weatherNudge.priority] || 'notice',
                  tip: weatherNudge.action || "Plan outfits with today's forecast in mind.",
              }
            : null,
    ].filter(Boolean);

    const formattedNudges = nudges.map((nudge, idx) => ({
        id: `${nudge.type}-${idx}`,
        label: formatNudgeLabel(nudge.type),
        message: nudge.message,
        priority: nudge.priority || 'medium',
        action: nudge.action,
        value: null,
    }));

    const fallbackSuggestions = wellnessAreas
        .filter((area) => area.status !== 'ok')
        .map((area) => ({
            id: `fallback-${area.label}`,
            label: area.label,
            message: area.tip || area.value,
            priority: area.status === 'low' ? 'high' : 'medium',
            value: area.value,
        }));

    const suggestionCards = formattedNudges.length ? formattedNudges : fallbackSuggestions;
    const priorityBadgeClass = {
        high: 'bg-[#fde4dc] text-[#b24327]',
        medium: 'bg-[#fff1e7] text-[#c26345]',
        low: 'bg-[#f7efe6] text-[#8a6b5a]',
    };

    return (
        <section className="px-4 py-12 pb-28 bg-[#FFFFF0]">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-3 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em] mx-auto">
                        <ActivityIcon />
                        Personal wellness
                    </div>
                    <h2 className="text-3xl font-bold">Profile-style wellness view</h2>
                    <p className="text-[#6b6b6b] max-w-3xl mx-auto">
                        Elders see their name, gentle stats, and only the recommendations that matter. No charts, no streaks, just reassurance.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,0.9fr)]">
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-20 h-20 rounded-3xl bg-[#fde9dc] flex items-center justify-center text-[#db7758] text-3xl font-bold">
                                {profile.name.slice(0, 2)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold">{profile.name}</h3>
                                <p className="text-sm text-[#6b6b6b]">
                                    {profile.age} years - {profile.city}
                                </p>
                                <p className="text-sm leading-relaxed text-[#6b6b6b]">{profile.note}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#f4d3b4] bg-[#fffaf0] p-5 space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">
                                        Hydration progress
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {hydration.current} / {hydration.goal} glasses
                                    </p>
                                    <p className="text-sm text-[#6b6b6b]">
                                        {hydration.current >= hydration.goal
                                            ? 'Goal met – great work.'
                                            : `${glassesRemaining} more glass${glassesRemaining === 1 ? '' : 'es'} today.`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleManualHydration}
                                    className="px-5 py-3 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md hover:bg-[#c86245]"
                                >
                                    + Log a glass
                                </button>
                            </div>
                            <div className="w-full h-3 rounded-full bg-[#f7d6c6]">
                                <div
                                    className="h-full rounded-full bg-[#db7758] transition-all"
                                    style={{ width: `${hydrationPercent}%` }}
                                />
                            </div>
                            {lastDrinkLabel && (
                                <p className="text-xs text-[#6b6b6b]">
                                    Last logged at {lastDrinkLabel}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {wellnessAreas.map((area) => (
                                <div key={area.label} className="rounded-2xl border border-[#f4d3b4] bg-[#fffaf0] p-4 space-y-1 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">{area.label}</p>
                                    <p className="text-lg font-bold">{area.value}</p>
                                    {area.tip && <p className="text-sm text-[#6b6b6b]">{area.tip}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-[#fde9dc] text-[#db7758]">
                                    <WellnessLeafIcon />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#db7758]">Recommendations only when needed</p>
                                    <h4 className="text-xl font-bold">Today's gentle suggestions</h4>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6b6b]">
                                {lastSyncLabel && <span>Synced {lastSyncLabel}</span>}
                                <button
                                    type="button"
                                    onClick={handleRefreshNudges}
                                    disabled={isFetchingNudges}
                                    className={`px-4 py-2 rounded-2xl border border-[#f4d3b4] text-[#db7758] font-semibold ${isFetchingNudges ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isFetchingNudges ? 'Refreshing…' : 'Refresh'}
                                </button>
                            </div>
                        </div>

                        {isFetchingNudges ? (
                            <div className="rounded-2xl border border-dashed border-[#f4d3b4] bg-[#fffaf0] p-4 text-sm text-[#6b6b6b]">
                                Checking for new suggestions…
                            </div>
                        ) : suggestionCards.length === 0 ? (
                            <p className="text-sm text-[#6b6b6b]">
                                {nudgesError
                                    ? `Unable to reach the wellness service (${nudgesError}).`
                                    : 'Everything looks steady today. Enjoy a calm chat or record a new memory.'}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {suggestionCards.map((card) => (
                                    <div key={card.id} className="rounded-2xl border border-[#f4d3b4] bg-[#fff6ea] p-4 space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">
                                            <span>{card.label}</span>
                                            <span
                                                className={`text-[10px] px-3 py-1 rounded-full ${
                                                    priorityBadgeClass[card.priority] || priorityBadgeClass.low
                                                }`}
                                            >
                                                {card.priority === 'high' ? 'Needs attention' : card.priority === 'medium' ? 'Reminder' : 'FYI'}
                                            </span>
                                        </div>
                                        <p className="font-semibold">{card.message}</p>
                                        {card.action && <p className="text-sm text-[#6b6b6b]">Suggested action: {card.action}</p>}
                                        {card.value && (
                                            <p className="text-sm text-[#6b6b6b]">Current status: {card.value}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="rounded-2xl bg-[#fef1e8] border border-[#f5d5c2] p-4 text-sm text-[#6b6b6b]">
                            Wellness doubles as a profile card. Caregivers can screenshot this view to share updates quickly.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.WellnessTab = WellnessTab;
