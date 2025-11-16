const { useState, useEffect, useRef } = React;
const { HeartIcon, SendIcon, ChatBubbleIcon } = window.AmilyIcons;

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

    return (
        <section className="px-4 py-12 pb-32 bg-[#FFFFF0]">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                        <ChatBubbleIcon />
                        Chat
                    </div>
                    <h2 className="text-3xl font-bold">Chat with Amily in a calm, mobile-first view</h2>
                    <p className="text-[#6b6b6b] max-w-3xl mx-auto">
                        Big buttons, warm colors, and both voice and text input keep conversations relaxed and easy to follow.
                    </p>
                </div>

                <div className="rounded-[32px] border border-[#f4d3b4] bg-white/95 shadow-xl p-6 space-y-6">
                    <div className="rounded-3xl bg-[#fffaf0] border border-[#f4d3b4] p-4 text-sm text-[#6b6b6b]">
                        <p>
                            Amily listens for medication, hydration, safety, and loneliness cues. Every reply is kept short so elders never feel rushed.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[#f4d3b4] bg-[#fffdf8] p-4 h-96 overflow-y-auto space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-[#6b6b6b]">
                                <HeartIcon className="w-8 h-8 text-[#db7758]" />
                                <p className="mt-3">Tap the microphone or type a message to begin.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-sm rounded-3xl px-4 py-3 text-sm shadow-sm ${
                                            msg.type === 'user'
                                                ? 'bg-white border border-[#f4d3b4]'
                                                : 'bg-[#db7758] text-white'
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

                    {error && (
                        <div className="rounded-2xl bg-[#ffe3dd] border border-[#f1bfb2] px-4 py-3 text-sm text-[#a6523b]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="rounded-3xl border border-[#f4d3b4] bg-white flex flex-col gap-4 p-4">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Type a note instead of talking</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={textInput}
                                onChange={(event) => setTextInput(event.target.value)}
                                placeholder="For example: I feel a bit lonely tonight..."
                                className="flex-1 rounded-2xl border border-[#f4d3b4] px-4 py-3 text-base text-[#545454] placeholder:text-[#9b9b9b] focus:outline-none focus:ring-2 focus:ring-[#db7758]"
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
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {statusCards.map((card) => (
                        <div
                            key={card.id}
                            className={`rounded-3xl border border-[#f4d3b4] p-4 text-center ${
                                card.active ? 'bg-[#db7758] text-white' : 'bg-white text-[#545454]'
                            }`}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.3em]">{card.title}</p>
                            <p className="text-lg font-bold mt-1">{card.subtitle}</p>
                            <p className="text-xs mt-1">{card.active ? 'Right now' : 'Standing by'}</p>
                        </div>
                    ))}
                </div>

                {lastResponseMeta && (
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-[#fff6ea] p-4 text-sm text-[#6b6b6b]">
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
