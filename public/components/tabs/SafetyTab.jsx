const { useState } = React;
const { ShieldIcon, PhoneIcon, AlertTriangleIcon } = window.AmilyIcons;

function SafetyTab({ darkMode }) {
    const [messages, setMessages] = useState([]);

    const triggerSafety = async (phrase) => {
        const alertMsg = {
            type: 'alert',
            title: '🚨 EMERGENCY ALERT',
            message: phrase,
        };
        setMessages((prev) => [...prev, alertMsg]);

        try {
            const response = await fetch('/api/safety/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'demo-user', type: 'manual', location: { lat: 40.7128, lng: -74.006 } }),
            });
            const data = await response.json();

            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        type: 'response',
                        title: 'Care Circle Notified',
                        message: data.message || 'Caregivers have been notified',
                    },
                ]);
            }, 500);
        } catch (error) {
            console.error('Safety check failed:', error);
        }
    };

    const emergencyScenarios = [
        { phrase: 'I need help', icon: PhoneIcon, color: 'from-red-600 to-rose-600', label: 'Need Help' },
        { phrase: 'I feel dizzy', icon: AlertTriangleIcon, color: 'from-orange-600 to-red-600', label: 'Feel Dizzy' },
        { phrase: 'I fell down', icon: AlertTriangleIcon, color: 'from-rose-600 to-pink-600', label: 'Fall Detected' },
    ];

    return (
        <section id="safety" className="relative py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mx-auto sm:mx-0 bg-black/5 backdrop-blur-sm">
                        <ShieldIcon />
                        <span className={darkMode ? 'text-rose-200' : 'text-rose-600'}>Emergency & safety</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className={`font-display text-3xl sm:text-4xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            If something feels wrong, one tap is enough.
                        </h2>
                        <p className={darkMode ? 'text-slate-400 text-sm sm:text-base' : 'text-slate-600 text-sm sm:text-base'}>
                            Amily spots worrying phrases and alerts your care circle – so no cry for help is missed.
                        </p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-rose-100'
                    }`}
                >
                    <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-lg">
                                <ShieldIcon />
                            </div>
                            <div>
                                <h3 className={darkMode ? 'text-slate-50 text-lg font-semibold' : 'text-slate-900 text-lg font-semibold'}>
                                    Safety Intelligence
                                </h3>
                                <p className={darkMode ? 'text-rose-200 text-xs' : 'text-rose-500 text-xs'}>
                                    Instant routing to emergency workflows and caregivers.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-rose-200/80">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                                High-risk phrases monitored
                            </span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {emergencyScenarios.map((scenario, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => triggerSafety(scenario.phrase)}
                                        className={`group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${scenario.color} text-white shadow-lg hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.99] transition-all duration-200`}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
                                                <scenario.icon />
                                            </div>
                                            <div className="font-semibold text-sm text-center">{scenario.label}</div>
                                            <span className="text-[11px] opacity-80">Tap to trigger help</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div
                                className={`rounded-2xl p-5 border text-sm bg-gradient-to-br ${
                                    darkMode ? 'from-rose-950/80 via-slate-950/70 to-slate-900/70 border-rose-500/30' : 'from-rose-50 via-white to-rose-50/80 border-rose-200'
                                }`}
                            >
                                <h3 className={darkMode ? 'text-rose-100 text-sm font-semibold mb-3' : 'text-rose-700 text-sm font-semibold mb-3'}>
                                    How alerts unfold
                                </h3>
                                <ol className="space-y-2 list-decimal list-inside text-sm opacity-90">
                                    <li>Amily detects a high-risk phrase or manual panic tap.</li>
                                    <li>She confirms with the user in a calm voice.</li>
                                    <li>Caregivers receive SMS + push alerts with the transcript.</li>
                                    <li>Optional: automatically calls local emergency services.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl p-5 min-h-[18rem] max-h-[22rem] overflow-y-auto border bg-black/5">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-sm opacity-70">
                                        <p>{`Panic phrases like “I fell” or “I can't breathe” appear here.`}</p>
                                        <p>Alerts are routed instantly.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 mb-3 rounded-2xl border ${
                                                msg.type === 'alert'
                                                    ? darkMode
                                                        ? 'bg-rose-950/50 border-rose-800 text-rose-50'
                                                        : 'bg-rose-50 border-rose-200 text-rose-600'
                                                    : darkMode
                                                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100'
                                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-sm">{msg.title}</div>
                                                <span className="text-[11px] opacity-75">
                                                    {msg.type === 'alert' ? 'Detected' : 'Care circle notified'}
                                                </span>
                                            </div>
                                            <div className="text-sm">{msg.message}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="text-[11px] sm:text-xs text-slate-500 space-y-1">
                                <p>Amily does not replace emergency services. Always call your local emergency number first.</p>
                                <p>Safety alerts are routed to your configured caregivers and workflows, with a clear, gentle message.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.SafetyTab = SafetyTab;

