const { useState } = React;
const { ActivityIcon, DropletsIcon, PillIcon } = window.AmilyIcons;

function WellnessTab({ darkMode }) {
    const [nudges, setNudges] = useState([
        '💊 Time to take your medication',
        '💧 Do not forget to hydrate',
        '🚶 A little walk would do you good',
    ]);
    const [waterCount, setWaterCount] = useState(3);

    const logActivity = async (type) => {
        if (type === 'water') setWaterCount((prev) => prev + 1);
        alert('✓ Activity logged!');
    };

    const wellnessActions = [
        { type: 'water', icon: DropletsIcon, label: 'Drank Water', color: 'from-blue-500 to-cyan-500' },
        { type: 'medication', icon: PillIcon, label: 'Took Meds', color: 'from-purple-500 to-pink-500' },
        { type: 'activity', icon: ActivityIcon, label: 'Did Activity', color: 'from-emerald-500 to-teal-500' },
    ];

    return (
        <section id="wellness" className="relative py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mx-auto sm:mx-0 bg-black/5 backdrop-blur-sm">
                        <ActivityIcon />
                        <span className={darkMode ? 'text-sky-200' : 'text-sky-600'}>Gentle wellness nudges</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className={`font-display text-3xl sm:text-4xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            Tiny reminders that keep you feeling steady.
                        </h2>
                        <p className={darkMode ? 'text-slate-400 text-sm sm:text-base' : 'text-slate-600 text-sm sm:text-base'}>
                            Amily keeps track of water, medication, and movement – always in a gentle, non-judgmental way.
                        </p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-sky-100'
                    }`}
                >
                    <div className="p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
                        <div className="space-y-6">
                            <div
                                className={`rounded-2xl p-5 border text-sm bg-gradient-to-br ${
                                    darkMode
                                        ? 'from-sky-950/80 via-slate-900/80 to-slate-900/70 border-sky-500/40'
                                        : 'from-sky-50 via-white to-sky-50/80 border-sky-200'
                                }`}
                            >
                                <h3 className={darkMode ? 'text-sky-100 text-sm font-semibold mb-4' : 'text-sky-700 text-sm font-semibold mb-4'}>
                                    Today’s gentle reminders
                                </h3>
                                <div className="space-y-3">
                                    {nudges.map((nudge, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-black/5 border border-white/5 shadow-sm"
                                        >
                                            <span className="text-lg">{nudge.charAt(0)}</span>
                                            <p className={darkMode ? 'text-slate-100 text-sm' : 'text-slate-800 text-sm'}>{nudge.slice(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {wellnessActions.map((action) => (
                                    <button
                                        key={action.type}
                                        onClick={() => logActivity(action.type)}
                                        className={`group p-5 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.99] transition-all duration-200 flex flex-col items-center gap-2`}
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
                                            <action.icon />
                                        </div>
                                        <div className="font-semibold text-center text-sm">{action.label}</div>
                                        <span className="text-[11px] opacity-80 group-hover:opacity-100">Tap to log</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: waterCount, label: 'Glasses of water' },
                                    { value: '✓', label: 'Morning medication' },
                                    { value: '72°F', label: 'Local temperature' },
                                    { value: '☀️', label: 'Today’s weather' },
                                ].map((stat, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-2xl p-4 text-center shadow-md border bg-gradient-to-br ${
                                            darkMode
                                                ? 'from-slate-950/90 via-slate-900/80 to-slate-900/70 border-slate-700'
                                                : 'from-slate-50 via-white to-slate-50/80 border-slate-200'
                                        }`}
                                    >
                                        <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>{stat.value}</div>
                                        <div className={darkMode ? 'text-[11px] text-slate-300' : 'text-[11px] text-slate-600'}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <p className={darkMode ? 'text-[11px] text-slate-500' : 'text-[11px] text-slate-500'}>
                                Amily will never scold or guilt-trip – every nudge is phrased with kindness and respect.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.WellnessTab = WellnessTab;

