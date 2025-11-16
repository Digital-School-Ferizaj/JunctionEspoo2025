const { useState, useEffect, useRef } = React;
const { HeartIcon, SendIcon, ChatBubbleIcon, MicIcon } = window.AmilyIcons;

const HYDRATION_KEYWORDS = ['drink', 'drank', 'water', 'hydrate', 'hydrated', 'hydration', 'thirsty', 'tea', 'juice'];
const REMINDER_KEYWORDS = ['remind', 'reminder', 'remember to', 'should drink', 'need to drink'];
const NUMBER_WORD_MAP = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
};
const QUANTITY_PATTERN = /(\d+(?:\.\d+)?)\s*(glass|glasses|cup|cups|bottle|bottles|drink|drinks|oz|ml|liter|litre|liters|litres)/;

const normalizeText = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const clampQuantity = (value) => Math.max(1, Math.min(4, Math.round(value || 1)));

const extractQuantityFromText = (normalizedText) => {
    const match = normalizedText.match(QUANTITY_PATTERN);
    if (match) {
        return clampQuantity(parseFloat(match[1]));
    }
    const numberWord = Object.keys(NUMBER_WORD_MAP).find((word) => normalizedText.includes(` ${word} `) || normalizedText.startsWith(`${word} `) || normalizedText.endsWith(` ${word}`) || normalizedText === word);
    if (numberWord) {
        return clampQuantity(NUMBER_WORD_MAP[numberWord]);
    }
    if (normalizedText.includes('couple')) {
        return 2;
    }
    return 1;
};

const detectHydrationIntent = (text) => {
    if (!text) return null;
    const normalized = normalizeText(text);
    if (!normalized) return null;

    const mentionsHydration = HYDRATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
    if (!mentionsHydration) return null;

    const isReminderOnly = REMINDER_KEYWORDS.some((keyword) => normalized.includes(keyword));
    if (isReminderOnly && !normalized.includes('drank') && !normalized.includes('finished') && !normalized.includes('had ')) {
        return null;
    }

    return { quantity: extractQuantityFromText(normalized) };
};

const logHydrationFromChat = (quantity = 1) => {
    if (typeof window === 'undefined' || !quantity) return;
    const wellnessStore = window.AmilyWellness;
    if (wellnessStore && typeof wellnessStore.adjustHydration === 'function') {
        wellnessStore.adjustHydration(quantity);
    }
};

function ChatTab({ userId = 'voice-user', authToken = null }) {
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [pipelineStage, setPipelineStage] = useState('idle');
    const [lastResponseMeta, setLastResponseMeta] = useState(null);
    const recognitionRef = useRef(null);
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

        const hydrationIntent = detectHydrationIntent(text);
        if (hydrationIntent) {
            logHydrationFromChat(hydrationIntent.quantity);
        }

        setMessages((prev) => [...prev, { type: 'user', text }]);
        setIsLoading(true);
        setError(null);
        setPipelineStage('thinking');
        setLastResponseMeta(null);

        try {
            const res = await fetch('/api/chatbox', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({
                    userId: userId || 'voice-user',
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

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!textInput.trim()) return;
        handleSend(textInput);
        setTextInput('');
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.warn('Unable to start recognition', error);
            }
        }
    };

    const statusCards = [
        {
            id: 'listening',
            title: 'Listening',
            subtitle: 'Waiting to hear you',
            active: pipelineStage === 'listening',
        },
        {
            id: 'thinking',
            title: 'Thinking',
            subtitle: 'Gemini 1.5 Pro',
            active: pipelineStage === 'thinking',
        },
        {
            id: 'speaking',
            title: 'Speaking',
            subtitle: 'ElevenLabs voice',
            active: pipelineStage === 'speaking',
        },
    ];

    const rippleLayers = [0, 1, 2];

    return (
        <section className="px-4 py-12 pb-36 bg-[#FFFFF0]">
            <style>
                {`
                    @keyframes pulseRing {
                        0% {
                            transform: translate(-50%, -50%) scale(0.65);
                            opacity: 0.45;
                        }
                        70% {
                            opacity: 0.15;
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.4);
                            opacity: 0;
                        }
                    }

                    @keyframes micGlow {
                        0% {
                            box-shadow: 0 25px 60px rgba(219, 119, 88, 0.35);
                        }
                        50% {
                            box-shadow: 0 35px 90px rgba(219, 119, 88, 0.55);
                        }
                        100% {
                            box-shadow: 0 25px 60px rgba(219, 119, 88, 0.35);
                        }
                    }

                    @keyframes gradientFloat {
                        0% {
                            transform: scale(1) translateY(0);
                        }
                        50% {
                            transform: scale(1.08) translateY(-10px);
                        }
                        100% {
                            transform: scale(1) translateY(0);
                        }
                    }
                    @keyframes listeningWave {
                        0% {
                            transform: translate(-50%, -50%) scale(0.9);
                            border-radius: 46% 54% 52% 48% / 48% 45% 55% 52%;
                            opacity: 0.9;
                        }
                        50% {
                            transform: translate(-50%, -50%) scale(1.05);
                            border-radius: 56% 44% 46% 54% / 52% 58% 42% 48%;
                            opacity: 0.55;
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(0.9);
                            border-radius: 46% 54% 52% 48% / 48% 45% 55% 52%;
                            opacity: 0.9;
                        }
                    }
                `}
            </style>
            <div className="max-w-5xl mx-auto space-y-10">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                        <ChatBubbleIcon />
                        Amily chat
                    </div>
                    <h2 className="text-3xl font-bold">A centered microphone built for calm check-ins</h2>
                    <p className="text-[#6b6b6b] max-w-3xl mx-auto">
                        We kept the same warm palette but reshaped the experience around a single glowing control, making it easy for elders to press, speak, and feel heard.
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-[48px] border border-[#f4d3b4] bg-white shadow-xl px-6 py-14">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fff5eb] via-[#ffe9dc] to-[#ffe1d0] opacity-70" aria-hidden="true" />
                    <div className="absolute -inset-x-24 -bottom-20 h-72 bg-gradient-to-r from-[#ffe2d2]/80 via-transparent to-[#ffd2c0]/70 blur-3xl opacity-70" aria-hidden="true" />
                    <div className="relative flex flex-col items-center gap-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em] border border-white/60 shadow-sm">
                            <ChatBubbleIcon />
                            Voice first
                        </div>
                        <h3 className="text-2xl font-semibold">Hold the glowing mic to check in with Amily</h3>
                        <div className="relative flex items-center justify-center w-full">
                            <div className="relative flex items-center justify-center w-[260px] h-[260px] md:w-[320px] md:h-[320px]">
                                <div
                                    className="absolute inset-2 rounded-full bg-gradient-to-br from-[#ffe6d7] via-[#ffd3c1] to-[#f6b7a0] blur-3xl opacity-90 animate-[gradientFloat_6s_ease-in-out_infinite]"
                                    aria-hidden="true"
                                />
                                {isListening &&
                                    rippleLayers.map((layer) => (
                                        <span
                                            key={layer}
                                            className="pointer-events-none absolute rounded-full bg-gradient-to-br from-[#ffe2d2] via-[#f7b7a0] to-[#db7758]"
                                            style={{
                                                width: `${220 + layer * 90}px`,
                                                height: `${220 + layer * 90}px`,
                                                opacity: 0.45 - layer * 0.12,
                                                top: '50%',
                                                left: '50%',
                                                animation: `pulseRing 2.8s ease-out ${layer * 0.45}s infinite`,
                                                transformOrigin: 'center',
                                            }}
                                        />
                                    ))}
                                <button
                                    type="button"
                                    onClick={startListening}
                                    disabled={isListening || isLoading}
                                    aria-label={isListening ? 'Listening...' : 'Start speaking'}
                                    className={`relative z-10 flex flex-col items-center justify-center rounded-full border-[6px] border-white bg-[#db7758] text-white shadow-[0_25px_70px_rgba(219,119,88,0.45)] transition-transform duration-300 h-40 w-40 md:h-48 md:w-48 ${
                                        isListening ? 'scale-105 animate-[micGlow_1.8s_ease-in-out_infinite]' : 'hover:scale-105'
                                    } ${isListening || isLoading ? 'opacity-90 cursor-not-allowed' : ''}`}
                                >
                                    {isListening ? (
                                        <>
                                            <span
                                                className="absolute inset-4 rounded-full bg-gradient-to-br from-[#ffe7db] via-[#ffb99b] to-[#db7758] opacity-80 blur-2xl"
                                                aria-hidden="true"
                                            />
                                            <span
                                                className="pointer-events-none absolute left-1/2 top-1/2 w-32 h-32 md:w-36 md:h-36 bg-gradient-to-br from-[#fff3ec] via-[#ffc7af] to-[#f18d6a]"
                                                style={{
                                                    animation: 'listeningWave 2.4s ease-in-out infinite',
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span className="relative text-xs font-semibold uppercase tracking-[0.35em]">
                                                Listening
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <MicIcon className="text-[2.9rem]" />
                                            <span className="text-[10px] uppercase tracking-[0.4em] font-semibold opacity-80">Speak</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-[#6b6b6b]">
                            {isListening
                                ? 'The animated ring means Amily hears you right now.'
                                : 'Tap the circle whenever it feels easier to speak than to type.'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                            {statusCards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`px-5 py-4 rounded-full border text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                        card.active ? 'bg-[#db7758] text-white border-[#db7758] shadow-md' : 'bg-white/80 text-[#545454] border-[#f4d3b4]'
                                    }`}
                                >
                                    <div>{card.title}</div>
                                    <div className="text-[10px] tracking-[0.2em] mt-1">{card.active ? card.subtitle : 'Standing by'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[36px] border border-[#f4d3b4] bg-white/95 shadow-lg p-6 space-y-4">
                        <div className="flex items-center justify-between text-sm text-[#6b6b6b]">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Conversation timeline</p>
                            <span>{messages.length ? `${messages.length} exchanges today` : 'Awaiting first hello'}</span>
                        </div>
                        <div className="h-[26rem] rounded-3xl border border-[#f6dcca] bg-[#fffdf8] p-4 overflow-y-auto space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-[#6b6b6b]">
                                    <HeartIcon className="w-10 h-10 text-[#db7758]" />
                                    <p className="mt-3">The log will appear here after your first chat bubble.</p>
                                    <p className="text-xs mt-1 opacity-70">Try tapping the glowing mic above.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-sm rounded-3xl px-4 py-3 text-sm shadow-sm ${
                                                msg.type === 'user' ? 'bg-white border border-[#f4d3b4]' : 'bg-[#db7758] text-white'
                                            }`}
                                        >
                                            <div className="font-semibold text-xs mb-1 opacity-75">{msg.type === 'user' ? 'You' : 'Amily'}</div>
                                            <div className="leading-relaxed">{msg.text}</div>
                                            {msg.meta && (
                                                <div className="text-[10px] mt-1 opacity-80">
                                                    Reasoning: {msg.meta.reasoningModel} | Voice: {msg.meta.voiceModel}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[36px] border border-[#f4d3b4] bg-white/95 shadow-lg p-6 space-y-5">
                        <div className="rounded-3xl bg-[#fffaf0] border border-[#f4d3b4] p-4 text-sm text-[#6b6b6b]">
                            <p>Prefer typing instead? Jot a gentle note and Amily responds with the same warm tone.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Type a note</label>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(event) => setTextInput(event.target.value)}
                                    placeholder="For example: I feel a bit lonely tonight..."
                                    className="w-full rounded-2xl border border-[#f4d3b4] px-4 py-3 text-base text-[#545454] placeholder:text-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#db7758]"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md disabled:opacity-60"
                                >
                                    <SendIcon />
                                    Send
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b6b6b]">
                                <button
                                    type="button"
                                    onClick={startListening}
                                    disabled={isListening || isLoading}
                                    className={`px-5 py-3 rounded-2xl font-semibold border-2 border-[#db7758] text-[#db7758] ${
                                        isListening ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isListening ? 'Listening...' : 'Use microphone'}
                                </button>
                                {isLoading && <span>Amily is thinking about your words...</span>}
                            </div>
                        </form>

                        {error && (
                            <div className="rounded-2xl bg-[#ffe3dd] border border-[#f1bfb2] px-4 py-3 text-sm text-[#a6523b]">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {lastResponseMeta && (
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-[#fff6ea] p-4 text-sm text-[#6b6b6b] shadow-sm">
                        <p>
                            Reasoning model: {lastResponseMeta.reasoningModel || 'Gemini 1.5 Pro'} - Voice model:{' '}
                            {lastResponseMeta.voiceModel || 'ElevenLabs'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.ChatTab = ChatTab;
