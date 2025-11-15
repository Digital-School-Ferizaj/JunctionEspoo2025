const { useState } = React;
const { BookOpenIcon, SaveIcon } = window.AmilyIcons;

function MemoriesTab({ darkMode }) {
    const [input, setInput] = useState('');
    const [memories, setMemories] = useState([
        {
            title: 'The Old Oak Tree',
            era: 'Childhood, 1950s',
            story: 'There was this big oak tree behind our house. My brother and I would climb it every summer. We had sit up there for hours, watching the world go by.',
        },
    ]);

    const saveMemory = async () => {
        if (!input.trim()) {
            alert('Please share a memory first...');
            return;
        }

        setMemories((prev) => [
            {
                title: 'New Memory',
                era: new Date().getFullYear().toString(),
                story: input,
            },
            ...prev,
        ]);
        setInput('');
        alert('✓ Memory saved');
    };

    return (
        <section id="memories" className="relative py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mx-auto sm:mx-0 bg-black/5 backdrop-blur-sm">
                        <BookOpenIcon />
                        <span className={darkMode ? 'text-violet-200' : 'text-violet-600'}>MemoryLane</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className={`font-display text-3xl sm:text-4xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            Capture the stories that make you, you.
                        </h2>
                        <p className={darkMode ? 'text-slate-400 text-sm sm:text-base' : 'text-slate-600 text-sm sm:text-base'}>
                            Amily turns your memories into beautiful, structured stories that families can revisit together.
                        </p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-violet-100'
                    }`}
                >
                    <div className="p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                        <div className="space-y-4">
                            <label
                                className={`text-xs font-medium uppercase tracking-[0.2em] ${
                                    darkMode ? 'text-slate-300' : 'text-slate-500'
                                }`}
                            >
                                Share a memory with Amily
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={6}
                                placeholder="For example: When I was a child, my brother and I would climb the big oak tree behind our house every summer..."
                                className={`w-full px-6 py-4 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/60 ${
                                    darkMode
                                        ? 'border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500'
                                        : 'border border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                                }`}
                            />
                            <button
                                onClick={saveMemory}
                                className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                <SaveIcon />
                                Save this memory
                            </button>
                            <p className={darkMode ? 'text-[11px] text-slate-500' : 'text-[11px] text-slate-500'}>
                                Amily gently extracts a title, time period, and summary – so your story is easy to revisit later.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className={darkMode ? 'text-slate-100 text-sm font-semibold' : 'text-slate-900 text-sm font-semibold'}>
                                Your saved memories
                            </h3>
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                                {memories.map((memory, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-5 rounded-2xl border-l-4 border-purple-500 shadow-md bg-gradient-to-br ${
                                            darkMode ? 'from-purple-950/80 via-slate-950/70 to-slate-900/70' : 'from-purple-50 via-white to-violet-50/80'
                                        }`}
                                    >
                                        <h4 className={darkMode ? 'text-purple-200 text-base font-semibold mb-1' : 'text-purple-700 text-base font-semibold mb-1'}>
                                            {memory.title}
                                        </h4>
                                        <div className={darkMode ? 'text-[11px] text-slate-400 mb-2' : 'text-[11px] text-slate-500 mb-2'}>{memory.era}</div>
                                        <p className={darkMode ? 'text-slate-100 text-sm leading-relaxed' : 'text-slate-700 text-sm leading-relaxed'}>{memory.story}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.MemoriesTab = MemoriesTab;

