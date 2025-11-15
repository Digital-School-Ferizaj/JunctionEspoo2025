const { useState, useEffect, useRef } = React;
const { HeartIcon, SendIcon } = window.AmilyIcons;

function ChatTab({ darkMode }) {
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [pipelineStage, setPipelineStage] = useState('idle');
    const [lastResponseMeta, setLastResponseMeta] = useState(null);
    const recognitionRef = useRef(null);
    const userId = 'voice-user';

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Voice input is not available in this browser. Please use Chrome on desktop.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setPipelineStage('listening');
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event);
            setIsListening(false);
            setPipelineStage('idle');
            setError('I had trouble hearing you. Please try again.');
        };
        recognition.onend = () => {
            setIsListening(false);
            setPipelineStage((stage) => (stage === 'listening' ? 'idle' : stage));
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            handleSend(transcript);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, []);

    const handleSend = async (rawText) => {
        const text = rawText?.trim();
        if (!text) return;

        setMessages((prev) => [...prev, { type: 'user', text }]);
        setIsLoading(true);
        setError(null);
        setPipelineStage('thinking');
        setLastResponseMeta(null);

        try {
            const res = await fetch('/api/chatbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    input: text,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Something went wrong while talking to Amily.');
                setPipelineStage('idle');
            } else {
                const aiText = data.ttsText || data.data?.response || 'I am here with you.';
                setMessages((prev) => [
                    ...prev,
                    {
                        type: 'amily',
                        text: aiText,
                        emotion: data.data?.emotion,
                        meta: {
                            reasoningModel: data.data?.reasoningModel || 'Gemini 1.5 Pro',
                            voiceModel: data.data?.voiceModel || 'ElevenLabs',
                        },
                    },
                ]);

                setLastResponseMeta({
                    firstTurn: data.data?.firstTurn,
                    reasoningModel: data.data?.reasoningModel,
                    voiceModel: data.data?.voiceModel,
                });

                if (data.audioUrl) {
                    try {
                        setPipelineStage('speaking');
                        const audio = new Audio(data.audioUrl);
                        audio.onended = () => setPipelineStage('idle');
                        audio.onerror = () => setPipelineStage('idle');
                        audio.play().catch((err) => {
                            console.warn('Could not play audio:', err);
                            setPipelineStage('idle');
                        });
                    } catch (err) {
                        console.warn('Audio element error:', err);
                        setPipelineStage('idle');
                    }
                } else {
                    setPipelineStage('idle');
                }
            }
        } catch (err) {
            console.error('ChatBox request error:', err);
            setError('Network error while talking to Amily.');
            setPipelineStage('idle');
        } finally {
            setIsLoading(false);
            setPipelineStage((stage) => (stage === 'speaking' ? stage : 'idle'));
        }
    };

    const handleTextSubmit = (event) => {
        event.preventDefault();
        if (isLoading) return;
        const text = textInput.trim();
        if (!text) return;
        handleSend(text);
        setTextInput('');
    };

    const startListening = () => {
        if (!recognitionRef.current) {
            setError('Voice input is not available in this browser.');
            return;
        }
        setError(null);
        recognitionRef.current.start();
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/chatbox/history/${encodeURIComponent(userId)}`);
                const data = await res.json();
                if (res.ok && data.success && Array.isArray(data.data)) {
                    setMessages(
                        data.data.map((m) => ({
                            type: m.type === 'user' ? 'user' : 'amily',
                            text: m.text,
                            emotion: m.emotion,
                            timestamp: m.timestamp,
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
            }
        })();
    }, []);

    const pipelineSteps = [
        {
            id: 'listening',
            title: 'Listening',
            subtitle: 'Microphone capture',
            description: 'Your voice is transcribed in gentle real time.',
        },
        {
            id: 'thinking',
            title: 'Gemini reasoning',
            subtitle: 'Gemini 1.5 Pro 002',
            description: 'Gemini understands tone and drafts a caring reply.',
        },
        {
            id: 'speaking',
            title: 'ElevenLabs voice',
            subtitle: 'Rachel · eleven_monolingual_v1',
            description: 'ElevenLabs speaks Amily’s words softly back to you.',
        },
    ];

    return (
        <section id="chatbox" className="relative py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mx-auto sm:mx-0 bg-black/5 backdrop-blur-sm">
                        <HeartIcon />
                        <span className={darkMode ? 'text-rose-200' : 'text-rose-600'}>Voice ChatBox</span>
                    </div>
                    <div className="space-y-1">
                        <h2 className={`font-display text-3xl sm:text-4xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                            Gemini thinks. ElevenLabs speaks.
                        </h2>
                        <p className={darkMode ? 'text-slate-400 text-sm sm:text-base' : 'text-slate-600 text-sm sm:text-base'}>
                            Tell Amily how you feel. Gemini 1.5 Pro 002 composes the response, then ElevenLabs reads it back in a warm, steady voice.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-10">
                    <div
                        className={`rounded-3xl p-5 border shadow-lg text-sm ${
                            darkMode ? 'bg-slate-950/70 border-slate-800 text-slate-200' : 'bg-white/90 border-rose-100 text-slate-700'
                        }`}
                    >
                        <div className="text-[11px] uppercase tracking-[0.24em] font-semibold opacity-70 mb-1">Reasoning</div>
                        <div className="text-xl font-semibold mb-1">Gemini 1.5 Pro 002</div>
                        <p className="text-sm opacity-80">Understands mood, context, and routines. Keeps responses slow, short, and reassuring.</p>
                    </div>
                    <div
                        className={`rounded-3xl p-5 border shadow-lg text-sm ${
                            darkMode
                                ? 'bg-slate-950/70 border-rose-500/40 text-slate-200'
                                : 'bg-gradient-to-br from-rose-50 via-white to-rose-100 border-rose-200 text-slate-700'
                        }`}
                    >
                        <div className="text-[11px] uppercase tracking-[0.24em] font-semibold opacity-70 mb-1">Voice</div>
                        <div className="text-xl font-semibold mb-1">ElevenLabs · Rachel</div>
                        <p className="text-sm opacity-80">Plays Amily’s words back with gentle pacing, soft breaths, and clear articulation.</p>
                    </div>
                </div>

                <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-rose-100'
                    }`}
                >
                    <div className="p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]">
                        <div className="space-y-7 flex flex-col justify-between">
                            <div className="space-y-5">
                                <p className={darkMode ? 'text-slate-300 text-sm' : 'text-slate-700 text-sm'}>
                                    Share feelings or questions. Gemini watches for medication, hydration, loneliness, and confusion cues before gently answering.
                                </p>
                                <button
                                    type="button"
                                    onClick={startListening}
                                    disabled={isListening || isLoading}
                                    className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-sm font-semibold shadow-lg border transition-all duration-200 ${
                                        darkMode
                                            ? 'bg-slate-950 border-rose-500/60 text-slate-50 hover:bg-slate-900'
                                            : 'bg-white border-rose-300 text-rose-700 hover:bg-rose-50'
                                    } ${isListening || isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                    <span className={`w-9 h-9 rounded-full flex items-center justify-center ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-rose-500/80'}`}>
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 10-6 0v4a3 3 0 003 3zm0 0v5m-4 0h8" />
                                        </svg>
                                    </span>
                                    <span>{isListening ? 'Listening… speak gently to Amily' : 'Press to talk to Amily'}</span>
                                </button>
                                <form onSubmit={handleTextSubmit} className="space-y-3">
                                    <label className={`text-[11px] uppercase tracking-[0.28em] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Or type a gentle message
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="“I feel a little lonely this afternoon...”"
                                        className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/60 ${
                                            darkMode
                                                ? 'bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500'
                                                : 'bg-white border border-rose-100 text-slate-800 placeholder-slate-400'
                                        }`}
                                    />
                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-semibold shadow-lg disabled:opacity-60"
                                        >
                                            <SendIcon />
                                            Send softly
                                        </button>
                                        <span className="text-[11px] text-slate-400">Responses stay gentle, private, and stored in Supabase.</span>
                                    </div>
                                </form>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {pipelineSteps.map((step) => {
                                        const isActive = pipelineStage === step.id;
                                        return (
                                            <div
                                                key={step.id}
                                                className={`rounded-2xl border px-3 py-3 text-xs space-y-1 ${
                                                    isActive
                                                        ? 'bg-gradient-to-br from-rose-500 to-red-500 text-white border-transparent shadow-lg'
                                                        : darkMode
                                                        ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                                                        : 'bg-white border-slate-100 text-slate-600'
                                                }`}
                                            >
                                                <div className="font-semibold text-[11px] uppercase tracking-[0.18em]">{step.title}</div>
                                                <div className="text-[11px] opacity-80">{step.subtitle}</div>
                                                <p className="text-[11px] leading-relaxed opacity-80">{step.description}</p>
                                                {isActive && <div className="text-[10px] font-semibold tracking-[0.2em]">ACTIVE</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {error && (
                                    <div className="text-xs px-3 py-2 rounded-2xl bg-red-900/40 border border-red-500/60 text-red-100">
                                        {error}
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="text-xs px-3 py-2 rounded-2xl bg-slate-900/40 border border-slate-700/60 text-slate-100">
                                        Amily is thinking about what to say back…
                                    </div>
                                )}
                                {lastResponseMeta && (
                                    <div className={`text-[11px] rounded-2xl px-3 py-2 border ${darkMode ? 'border-slate-800 text-slate-300' : 'border-rose-100 text-slate-600'}`}>
                                        <div>Reasoning: {lastResponseMeta.reasoningModel || 'Gemini 1.5 Pro 002'}</div>
                                        <div>Voice: {lastResponseMeta.voiceModel || 'ElevenLabs Rachel'}</div>
                                    </div>
                                )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                                Voice input works best in a quiet room, speaking slowly and clearly. Text input is always available if microphones are tricky.
                            </div>
                        </div>

                        <div
                            className={`rounded-2xl p-5 max-h-96 overflow-y-auto space-y-4 text-sm bg-gradient-to-b ${
                                darkMode ? 'from-slate-950/90 via-slate-900/75 to-slate-900/60 border border-slate-800' : 'from-rose-50 via-white to-rose-50/80 border border-rose-100'
                            }`}
                        >
                            {messages.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className={darkMode ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
                                        Press the microphone or type a message to let Gemini & ElevenLabs take care of you.
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
                                            {msg.meta && (
                                                <div className="text-[10px] mt-1 opacity-70">
                                                    Reasoning: {msg.meta.reasoningModel} · Voice: {msg.meta.voiceModel}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.ChatTab = ChatTab;

