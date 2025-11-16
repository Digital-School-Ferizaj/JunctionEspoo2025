const { useState, useEffect, useCallback } = React;
const { ShieldIcon, PhoneIcon } = window.AmilyIcons;

function SafetyTab({ userId = 'demo-user', authToken = null }) {
    const [lastAction, setLastAction] = useState(null);
    const [signals, setSignals] = useState([]);
    const [careAlarm, setCareAlarm] = useState(null);
    const contacts = [
        {
            label: 'Emergency services',
            subtitle: 'Call local emergency number immediately.',
            color: 'from-[#ff9380] to-[#f46a56]',
            type: 'emergency',
        },
        {
            label: 'Family contact',
            subtitle: 'Call Dana (daughter)',
            color: 'from-[#f8c06e] to-[#f49f52]',
            type: 'family',
        },
        {
            label: 'Personal doctor',
            subtitle: 'Dr. Patel - (555) 011-200',
            color: 'from-[#8ad6b3] to-[#5bb187]',
            type: 'doctor',
        },
        {
            label: 'Neighbor buddy',
            subtitle: 'Elli next door - (555) 010-447',
            color: 'from-[#90b7f6] to-[#5b8fd8]',
            type: 'neighbor',
        },
    ];

    const sendEmergencyRequest = useCallback(
        async (payload = {}) => {
            try {
                await fetch('/api/safety/emergency', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                    body: JSON.stringify({
                        userId: userId || 'demo-user',
                        type: payload.type || 'voice_keywords',
                        level: payload.level || 'emergency',
                        detected: payload.detected || [],
                        transcript: payload.text,
                        source: payload.source || 'chat',
                        location: payload.location ?? { lat: 40.7128, lng: -74.006 },
                    }),
                });
            } catch (error) {
                console.warn('Safety notification failed', error);
            }
        },
        [authToken, userId]
    );

    useEffect(() => {
        const handleSignal = (event) => {
            const detail = event.detail || {};
            const timeLabel = detail.timestamp
                ? new Date(detail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const signalEntry = {
                id: detail.id || `${Date.now()}`,
                level: detail.level || 'concern',
                detected: detail.detected || [],
                text: detail.text || 'Safety concern detected via chat',
                source: detail.source || 'chat',
                time: timeLabel,
            };
            setSignals((prev) => [signalEntry, ...prev].slice(0, 5));

            const severity = signalEntry.level;
            const isEmergency = severity === 'emergency';
            const requiresAlarm = severity && severity !== 'normal';

            if (isEmergency) {
                setLastAction({ type: 'voice emergency', time: timeLabel });
                if (!detail.notified) {
                    sendEmergencyRequest(detail);
                }
            }

            if (requiresAlarm) {
                const status =
                    detail.notified && isEmergency
                        ? 'Care circle alerted'
                        : isEmergency
                        ? 'Alerting care circle'
                        : 'Watching with care circle';

                setCareAlarm({
                    id: signalEntry.id,
                    status,
                    text: signalEntry.text,
                    detected: signalEntry.detected,
                    time: timeLabel,
                    source: signalEntry.source,
                    level: severity,
                });
            }
        };
        window.addEventListener('amily:safety:signal', handleSignal);
        return () => window.removeEventListener('amily:safety:signal', handleSignal);
    }, [sendEmergencyRequest]);

    const handlePress = async (type) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastAction({ type, time });

        sendEmergencyRequest({ type });
        setCareAlarm({
            id: `${Date.now()}`,
            status: 'Care circle alerted',
            text: `Manual ${type} alert sent from Safety tab`,
            detected: [],
            time,
            source: 'safety-tab',
            level: 'emergency',
        });
    };

    const dismissAlarm = () => setCareAlarm(null);

    return (
        <section className="px-4 py-12 pb-28 bg-[#FFFFF0]">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                        <ShieldIcon />
                        Quick safety board
                    </div>
                    <h2 className="text-3xl font-bold">Help is always the center tab away.</h2>
                    <p className="text-[#6b6b6b] max-w-2xl mx-auto">
                        The Safety page removes complicated screens. Each button calls a trusted person or service and alerts the care circle quietly.
                    </p>
                </div>

                {careAlarm && (
                    <div className="rounded-[32px] border border-[#f4b5a0] bg-gradient-to-br from-[#ffe3dc] via-[#ffc7bb] to-[#ff9d8a] shadow-2xl p-6 space-y-4 text-[#7a2e1f]">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em]">Care circle alarm</p>
                                <h3 className="text-2xl font-bold">Help is being notified right now</h3>
                                <p className="text-sm opacity-80">Stay nearby and keep your phone close. We already let your circle know.</p>
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] bg-white/40 rounded-full px-4 py-2">
                                {careAlarm.status}
                            </span>
                        </div>
                        <div className="rounded-2xl bg-white/70 border border-white/60 p-4 text-[#5a1f15] space-y-1">
                            <p className="text-sm font-semibold">{careAlarm.text}</p>
                            {careAlarm.detected?.length > 0 && (
                                <p className="text-xs">Buzz words: {careAlarm.detected.join(', ')}</p>
                            )}
                            <p className="text-xs opacity-75">
                                Source: {careAlarm.source === 'safety-tab' ? 'Safety page' : 'Voice chat'} · {careAlarm.time}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => sendEmergencyRequest({ type: 'care-circle-follow-up' })}
                                className="px-5 py-3 rounded-2xl bg-[#b93823] text-white text-sm font-semibold shadow-md hover:bg-[#a02f1c]"
                            >
                                Send another alert
                            </button>
                            <button
                                type="button"
                                onClick={dismissAlarm}
                                className="px-5 py-3 rounded-2xl border-2 border-white/70 text-sm font-semibold text-white/90 hover:text-white"
                            >
                                I am safe now
                            </button>
                        </div>
                    </div>
                )}

                {signals.length > 0 && (
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white shadow-lg p-6 space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Voice safety signal</p>
                                <h3 className="text-xl font-bold">Amily heard a concern</h3>
                            </div>
                            <span
                                className={`text-[11px] font-semibold uppercase tracking-[0.3em] px-4 py-2 rounded-full ${
                                    signals[0].level === 'emergency'
                                        ? 'bg-[#ffcbc2] text-[#b93823]'
                                        : 'bg-[#ffe8c9] text-[#a46132]'
                                }`}
                            >
                                {signals[0].level === 'emergency' ? 'Emergency keywords' : 'Concern keywords'}
                            </span>
                        </div>
                        <div className="rounded-2xl bg-[#fff6ea] border border-[#f5d5c2] p-4 space-y-2">
                            <p className="text-sm text-[#6b6b6b]">
                                "{signals[0].text}"
                            </p>
                            {signals[0].detected?.length > 0 && (
                                <p className="text-xs text-[#a05a46]">
                                    Detected phrases: {signals[0].detected.join(', ')}
                                </p>
                            )}
                            <p className="text-xs text-[#6b6b6b]">
                                Source: {signals[0].source === 'user' ? 'Microphone' : 'System'} · {signals[0].time}
                            </p>
                        </div>
                        {signals.length > 1 && (
                            <div className="text-xs text-[#6b6b6b]">
                                Recent signals:{' '}
                                {signals.slice(1).map((entry, idx) => (
                                    <span key={entry.id} className="inline-block mr-2">
                                        {entry.level === 'emergency' ? '⚠️' : 'ℹ️'} {entry.time}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {contacts.map((contact) => (
                        <button
                            key={contact.type}
                            type="button"
                            onClick={() => handlePress(contact.type)}
                            className={`rounded-3xl text-left text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-br ${contact.color} p-6 flex flex-col gap-3`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-bold">{contact.label}</div>
                                <div className="p-2 rounded-2xl bg-white/20">
                                    <PhoneIcon />
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed opacity-90">{contact.subtitle}</p>
                            <span className="text-xs font-semibold uppercase tracking-[0.3em]">Tap to start call</span>
                        </button>
                    ))}
                </div>

                <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold">Last safety action</h3>
                        {lastAction ? (
                            <div className="flex items-center justify-between rounded-2xl bg-[#fff6ea] border border-[#f5d5c2] p-4">
                                <div>
                                    <p className="text-sm text-[#6b6b6b]">Sent to care circle</p>
                                    <p className="text-xl font-bold text-[#db7758] capitalize">{lastAction.type} contact</p>
                                </div>
                                <span className="text-sm font-semibold">{lastAction.time}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-[#6b6b6b]">
                                No calls yet today. Large tiles above are easy to reach with shaky hands or tired eyes.
                            </p>
                        )}
                    </div>
                    <ul className="text-sm text-[#6b6b6b] space-y-2 list-disc pl-5">
                        <li>Emergency calls always open your phone app directly.</li>
                        <li>Family, doctor, and neighbor taps also send a short note to the care circle.</li>
                        <li>Keep this page open while traveling so the tab bar remains familiar.</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.SafetyTab = SafetyTab;
