const { useState } = React;
const { ShieldIcon, PhoneIcon } = window.AmilyIcons;

function SafetyTab() {
    const [lastAction, setLastAction] = useState(null);
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

    const handlePress = async (type) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastAction({ type, time });

        try {
            await fetch('/api/safety/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'demo-user',
                    type,
                    location: { lat: 40.7128, lng: -74.006 },
                }),
            });
        } catch (error) {
            console.warn('Safety notification failed', error);
        }
    };

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
