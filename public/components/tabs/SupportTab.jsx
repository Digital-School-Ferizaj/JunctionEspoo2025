const { useState } = React;
const { HeartIcon, SendIcon } = window.AmilyIcons;

function SupportTab({ darkMode }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userText = input;
        setMessages((prev) => [...prev, { type: 'user', text: userText }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/empathy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'demo-user', input: userText }),
            });
            const data = await response.json();

            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        type: 'amily',
                        text: data.summary || 'I am here for you',
                    },
                ]);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    type: 'amily',
                    text: 'I am here for you. Let me listen...',
                },
            ]);
            setIsLoading(false);
        }
    };

    return (
        <section id="empathy" className="relative py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mx-auto sm:mx-0 bg-black/5 backdrop-blur-sm">
                        <HeartIcon />
                        <span className={darkMode ? 'text-rose-200' : 'text-rose-600'}>Empathetic support</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className={`font-display text-3xl sm:text-4xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            A calm voice when things feel heavy.
                        </h2>
                        <p className={darkMode ? 'text-slate-400 text-sm sm:text-base' : 'text-slate-600 text-sm sm:text-base'}>
                            Amily listens carefully, reflects your feelings back, and answers with warmth – especially on difficult days.
                        </p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-rose-100'
                    }`}
                >
                    <div className="p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                        <div className="space-y-4">
                            <label
                                className={`text-xs font-medium uppercase tracking-[0.2em] ${
                                    darkMode ? 'text-slate-300' : 'text-slate-500'
                                }`}
                            >
                                Tell Amily how you are feeling
                            </label>
                            <div className="flex gap-3 flex-wrap">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="For example: I feel anxious tonight and I cannot sleep..."
                                    className={`flex-1 min-w-48 px-6 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/60 ${
                                        darkMode
                                            ? 'border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500'
                                            : 'border border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                                    }`}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon />
                                    Share with Amily
                                </button>
                            </div>
                            <p className={darkMode ? 'text-[11px] text-slate-500' : 'text-[11px] text-slate-500'}>
                                There are no “wrong” feelings here. Amily’s responses are always gentle and non-judgmental.
                            </p>

                            <div
                                className={`rounded-2xl p-5 border text-xs bg-gradient-to-br ${
                                    darkMode
                                        ? 'from-rose-950/80 via-slate-950/80 to-slate-900/70 border-rose-500/40'
                                        : 'from-rose-50 via-white to-red-50/80 border-rose-200'
                                }`}
                            >
                                <h3 className={darkMode ? 'text-rose-100 text-xs font-semibold mb-2' : 'text-rose-700 text-xs font-semibold mb-2'}>
                                    How Amily responds
                                </h3>
                                <ul className="list-disc list-inside space-y-1">
                                    <li className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                                        Detects your emotional tone (sad, anxious, hopeful, calm…)
                                    </li>
                                    <li className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                                        Crafts a short, soothing response in simple language
                                    </li>
                                    <li className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                                        Optionally speaks the response aloud with soft pacing
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div
                                className={`rounded-2xl p-5 min-h-64 max-h-80 overflow-y-auto space-y-4 text-sm bg-gradient-to-b ${
                                    darkMode
                                        ? 'from-slate-950/90 via-slate-900/75 to-slate-900/60 border border-slate-800'
                                        : 'from-rose-50 via-white to-rose-50/80 border border-rose-100'
                                }`}
                            >
                                {messages.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className={darkMode ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
                                            Share what is on your heart. Amily will answer softly and slowly.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-md rounded-2xl px-4 py-3 shadow-md ${
                                                    msg.type === 'user'
                                                        ? darkMode
                                                            ? 'bg-slate-950 border border-slate-700 text-slate-100'
                                                            : 'bg-white border border-slate-200 text-slate-800'
                                                        : 'bg-gradient-to-br from-rose-500 to-red-500 text-white'
                                                }`}
                                            >
                                                <div className="font-semibold text-[11px] mb-1 opacity-75">
                                                    {msg.type === 'user' ? 'You' : 'Amily'}
                                                </div>
                                                <div className="leading-relaxed">{msg.text}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-md">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200" />
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-400" />
                                            <span className="text-xs">Amily is thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.SupportTab = SupportTab;

