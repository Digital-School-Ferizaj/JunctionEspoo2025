const { useState } = React;
const { MemorySparkIcon, SaveIcon } = window.AmilyIcons;

function MemoriesTab() {
    const [input, setInput] = useState('');
    const [memories, setMemories] = useState([
        {
            title: 'The old oak tree',
            era: 'Childhood - 1950s',
            story: 'My brother and I climbed the oak tree near the river every Sunday. We counted clouds and felt brave.',
        },
    ]);

    const saveMemory = () => {
        if (!input.trim()) {
            alert('Please share a memory first.');
            return;
        }

        setMemories((prev) => [
            {
                title: 'New audio note',
                era: new Date().toLocaleDateString(),
                story: input.trim(),
            },
            ...prev,
        ]);
        setInput('');
    };

    return (
        <section className="px-4 py-12 pb-28 bg-[#FFFFF0]">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                        <MemorySparkIcon />
                        Memory lane
                    </div>
                    <h2 className="text-3xl font-bold">A gentle place to keep stories</h2>
                    <p className="text-[#6b6b6b]">Big text, warm colors, and patient buttons encourage elders to share even the smallest moments.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Tell a memory in your own words</label>
                        <textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            rows={6}
                            placeholder="For example: Every winter the lake would freeze and Dad would pull us on a sled..."
                            className="w-full rounded-3xl border border-[#f4d3b4] bg-[#fffaf0] p-5 text-base text-[#545454] placeholder:text-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#db7758]"
                        />
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={saveMemory}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md hover:bg-[#c86245]"
                            >
                                <SaveIcon />
                                Save memory
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput('')}
                                className="px-6 py-3 rounded-2xl border-2 border-[#f4d3b4] text-sm font-semibold text-[#6b6b6b]"
                            >
                                Clear
                            </button>
                        </div>
                        <p className="text-sm text-[#6b6b6b]">
                            Saved notes stay simple so they can be printed or read aloud later.
                        </p>
                    </div>

                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-4 max-h-[500px] overflow-y-auto">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Your story shelf</p>
                            <h3 className="text-xl font-bold">Recent memories</h3>
                        </div>
                        {memories.map((memory, index) => (
                            <div key={`${memory.title}-${index}`} className="rounded-2xl border border-[#f4d3b4] bg-[#fffaf0] p-4 space-y-2">
                                <h4 className="text-lg font-semibold">{memory.title}</h4>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">{memory.era}</p>
                                <p className="text-sm text-[#6b6b6b] leading-relaxed">{memory.story}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.MemoriesTab = MemoriesTab;
