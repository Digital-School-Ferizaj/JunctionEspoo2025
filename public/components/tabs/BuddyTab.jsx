const { useState } = React;
const { BuddyIcon } = window.AmilyIcons;

function BuddyTab() {
    const [lastHello, setLastHello] = useState(null);
    const buddies = [
        {
            id: 1,
            name: 'Leena H.',
            distance: '1 km away',
            interests: ['Knitting', 'Choir songs', 'Coffee walks'],
            availability: 'Most afternoons',
        },
        {
            id: 2,
            name: 'Mika P.',
            distance: '3 km away',
            interests: ['Fishing stories', 'Jazz radio', 'Gardening tips'],
            availability: 'Evenings and weekends',
        },
        {
            id: 3,
            name: 'Aada L.',
            distance: 'Same building',
            interests: ['Crosswords', 'Old films', 'Tea tasting'],
            availability: 'Every morning',
        },
    ];

    const handleHello = (buddy) => {
        setLastHello({ name: buddy.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    };

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
                    {buddies.map((buddy) => (
                        <div key={buddy.id} className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-md p-6 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#db7758]">{buddy.distance}</p>
                                    <h3 className="text-2xl font-bold">{buddy.name}</h3>
                                    <p className="text-sm text-[#6b6b6b]">Available: {buddy.availability}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleHello(buddy)}
                                    className="px-6 py-3 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md hover:bg-[#c86245]"
                                >
                                    Say hello
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {buddy.interests.map((interest) => (
                                    <span key={interest} className="px-4 py-2 rounded-full bg-[#fffaf0] border border-[#f4d3b4] text-sm text-[#545454]">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-3">
                    <h3 className="text-xl font-bold">Family can supervise matches</h3>
                    <p className="text-sm text-[#6b6b6b]">
                        When someone taps "Say hello", the family portal gets a note. Everyone stays connected yet safe.
                    </p>
                    {lastHello ? (
                        <div className="rounded-2xl bg-[#fff6ea] border border-[#f5d5c2] p-4 flex items-center justify-between text-sm">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Last wave sent</p>
                                <p>
                                    {lastHello.name} at {lastHello.time}
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-[#db7758]">Pending reply</span>
                        </div>
                    ) : (
                        <p className="text-sm text-[#6b6b6b]">No waves yet. Try greeting the closest buddy above.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.BuddyTab = BuddyTab;
