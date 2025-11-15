const { ActivityIcon, WellnessLeafIcon } = window.AmilyIcons;

function WellnessTab() {
    const profile = {
        name: 'Evelyn Parker',
        age: 78,
        city: 'Espoo',
        note: 'Prefers afternoon chats and short morning walks whenever the paths are dry.',
    };

    const wellnessAreas = [
        { label: 'Mood today', value: 'Tired but hopeful', status: 'low', tip: 'Listen to a favorite song and breathe slowly.' },
        { label: 'Rest last night', value: '5h 10m', status: 'notice', tip: 'A 20 minute rest after lunch will help.' },
        { label: 'Hydration', value: '2 of 6 glasses', status: 'low', tip: 'Sip one glass of water now.' },
        { label: 'Movement', value: '420 steps', status: 'notice', tip: 'Walk near the window for sunlight.' },
        { label: 'Medication', value: 'Morning taken', status: 'ok' },
        { label: 'Weather care', value: '3 C / icy', status: 'notice', tip: 'Use the handrail outside today.' },
    ];

    const alertAreas = wellnessAreas.filter((area) => area.status !== 'ok');

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
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-[#fde9dc] text-[#db7758]">
                                <WellnessLeafIcon />
                            </div>
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#db7758]">Recommendations only when needed</p>
                                <h4 className="text-xl font-bold">Today's gentle suggestions</h4>
                            </div>
                        </div>

                        {alertAreas.length === 0 ? (
                            <p className="text-sm text-[#6b6b6b]">
                                Everything looks steady today. Enjoy a calm chat or record a new memory.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {alertAreas.map((area) => (
                                    <div key={area.label} className="rounded-2xl border border-[#f4d3b4] bg-[#fff6ea] p-4 space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">{area.label}</p>
                                        <p className="font-semibold">{area.tip}</p>
                                        <p className="text-sm text-[#6b6b6b]">Current status: {area.value}</p>
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
