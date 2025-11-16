const { useState, useEffect, useRef, useCallback } = React;
const { MemorySparkIcon, SaveIcon, MicIcon } = window.AmilyIcons;
const { createPortal } = ReactDOM;

const MEMORY_IMAGE_PLACEHOLDERS = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
];

const getMemoryPlaceholderImage = () => {
    return MEMORY_IMAGE_PLACEHOLDERS[Math.floor(Math.random() * MEMORY_IMAGE_PLACEHOLDERS.length)];
};

function MemoriesTab({ userId = 'anonymous', authToken = null }) {
    const [input, setInput] = useState('');
    const [recording, setRecording] = useState(false);
    const [supportsSTT, setSupportsSTT] = useState(true);
    const recognitionRef = useRef(null);
    const baseInputRef = useRef('');
    const lastFinalIndexRef = useRef(-1);
    const lastFinalAggregateRef = useRef('');

    const punctuate = (raw, isFinal = false) => {
        let t = (raw || '').trim();
        if (!t) return '';

        t = t.replace(/^\s*([a-z])/, (_, c) => c.toUpperCase());
        if (!isFinal) return t;

        t = t.replace(/\s+(but|because|so|however|although|therefore|yet)\s+/gi, (m, p1) => {
            return ', ' + p1.toLowerCase() + ' ';
        });

        if (!/[.!?]$/.test(t)) t += '.';
        return t;
    };

    const generateTitleFromStory = (story) => {
        if (!story || !story.trim()) return 'A Special Memory';
        const s = story.trim();

        const firstSentenceMatch = s.match(/^([^.?!]+[.?!]?)/);
        let candidate = firstSentenceMatch ? firstSentenceMatch[0].trim() : s;

        const words = candidate.split(/\s+/).filter(Boolean);
        if (words.length > 6) {
            candidate = words.slice(0, 6).join(' ');
        }

        candidate = candidate.replace(/[\n\r]+/g, ' ').trim();
        if (candidate.length > 60) candidate = candidate.slice(0, 57).trim() + '...';

        candidate = candidate.replace(/^./, (c) => c.toUpperCase());

        return candidate || 'A Special Memory';
    };

    const [memories, setMemories] = useState([]);
    const [isLoadingMemories, setIsLoadingMemories] = useState(false);
    const [memoryError, setMemoryError] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);

    const loadMemories = useCallback(async () => {
        if (!userId) return;
        setIsLoadingMemories(true);
        setMemoryError(null);
        try {
            const res = await fetch(`/api/memory/${encodeURIComponent(userId)}?limit=50`, {
                headers: {
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data || !data.success) {
                throw new Error(data?.error || 'Could not load memories.');
            }
            const fetchedMemories = Array.isArray(data.data)
                ? data.data.map((entry) => ({
                      title: entry.title || generateTitleFromStory(entry.story || entry.story_3_sentences || ''),
                      era: entry.era || new Date(entry.timestamp || Date.now()).toLocaleDateString(),
                      story: entry.story || entry.story_3_sentences || '',
                      storyFull: entry.storyFull || entry.story_full || entry.story || entry.story_3_sentences || '',
                      imageUrl: entry.imageUrl || entry.image_url || getMemoryPlaceholderImage(),
                      timestamp: entry.timestamp,
                      tags: entry.tags || [],
                  }))
                : [];
            setMemories(fetchedMemories);
        } catch (error) {
            console.warn('Load memories failed:', error);
            setMemoryError(error?.message || 'Could not load memories.');
        } finally {
            setIsLoadingMemories(false);
        }
    }, [userId, authToken]);

    useEffect(() => {
        loadMemories();
    }, [loadMemories]);

    const saveMemory = async () => {
        if (!input.trim()) {
            alert('Please share a memory first.');
            return;
        }

        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ userId: userId || 'anonymous', storyInput: input.trim() }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data || !data.success) {
                const title = generateTitleFromStory(input.trim());
                setMemories((prev) => [
                    {
                        title,
                        era: new Date().toLocaleDateString(),
                        story: input.trim(),
                        storyFull: input.trim(),
                        imageUrl: getMemoryPlaceholderImage(),
                    },
                    ...prev,
                ]);
                setInput('');
                baseInputRef.current = '';
                return;
            }

            const mem = data.data || { title: generateTitleFromStory(input.trim()), story: input.trim() };
            const resolvedStory = mem.story_3_sentences ? mem.story_3_sentences : input.trim();
            const resolvedImage = mem.imageUrl || mem.image_url || getMemoryPlaceholderImage();
            const resolvedStoryFull = mem.storyFull || mem.story_full || input.trim();

            setMemories((prev) => [
                {
                    title: mem.title || generateTitleFromStory(input.trim()),
                    era: mem.era || new Date().toLocaleDateString(),
                    story: resolvedStory,
                    storyFull: resolvedStoryFull,
                    imageUrl: resolvedImage,
                },
                ...prev,
            ]);

            setInput('');
            baseInputRef.current = '';
        } catch (err) {
            console.warn('Save memory failed:', err);
            const title = generateTitleFromStory(input.trim());
            setMemories((prev) => [
                {
                    title,
                    era: new Date().toLocaleDateString(),
                    story: input.trim(),
                    storyFull: input.trim(),
                    imageUrl: getMemoryPlaceholderImage(),
                },
                ...prev,
            ]);
            setInput('');
            baseInputRef.current = '';
        }
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupportsSTT(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            lastFinalIndexRef.current = -1;
            lastFinalAggregateRef.current = '';
            setRecording(true);
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event);
            setRecording(false);
        };

        recognition.onend = () => setRecording(false);

        recognition.onresult = (event) => {
            const startIndex = event.resultIndex || 0;

            for (let i = startIndex; i < event.results.length; i++) {
                const res = event.results[i];
                const transcript = res[0]?.transcript?.trim() || '';

                if (res.isFinal) {
                    const chunk = punctuate(transcript, true);
                    baseInputRef.current = ((baseInputRef.current || '') + ' ' + chunk).trim();
                    setInput(baseInputRef.current);
                    lastFinalIndexRef.current = i;
                } else {
                    const interim = punctuate(transcript, false);
                    setInput(((baseInputRef.current || '') + ' ' + interim).trim());
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            try {
                recognitionRef.current?.abort();
            } catch {}
            recognitionRef.current = null;
        };
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && modalOpen) closeMemory();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [modalOpen]);

    const openMemory = (memory) => {
        setSelectedMemory(memory);
        setModalOpen(true);
    };

    const closeMemory = () => {
        setModalOpen(false);
        setSelectedMemory(null);
    };

    const readMemoryAloud = async () => {
        if (!selectedMemory) return;

        try {
            const ttsRes = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedMemory.storyFull || selectedMemory.story,
                }),
            });

            if (!ttsRes.ok) {
                throw new Error('TTS request failed');
            }

            const data = await ttsRes.json();
            if (!data.audioUrl) {
                throw new Error('No audio returned');
            }

            const audio = new Audio(data.audioUrl);
            audio.play().catch((err) => {
                console.warn('Audio playback failed:', err);
                alert('Audio playback failed. Please try again.');
            });
        } catch (err) {
            console.warn('Failed to generate audio for memory:', err);
            alert('Could not read memory aloud.');
        }
    };
    const shareMemory = () => {
        if (!selectedMemory) return;

        const text = `${selectedMemory.title}\n\n${selectedMemory.story}`;
        const encodedText = encodeURIComponent(text);

        // Try to open the native share dialog first (mobile-friendly)
        if (navigator.share) {
            navigator.share({
                title: selectedMemory.title,
                text: selectedMemory.story,
            }).catch(() => {
                // If native share fails, fall back to WhatsApp/Viber URLs
                openShareLinks(encodedText);
            });
        } else {
            // Desktop: open WhatsApp/Viber links
            openShareLinks(encodedText);
        }
    };

    const openShareLinks = (encodedText) => {
        // Create a simple modal or menu to choose where to share
        const choice = prompt(
            'Choose where to share:\n1 = WhatsApp\n2 = Viber\n3 = Copy to clipboard',
            '1'
        );

        if (choice === '1') {
            // WhatsApp: web.whatsapp.com or whatsapp://
            window.open(
                `https://wa.me/?text=${encodedText}`,
                '_blank'
            );
        } else if (choice === '2') {
            // Viber: viber:// protocol
            window.open(
                `viber://forward?text=${encodedText}`,
                '_blank'
            );
        } else if (choice === '3') {
            // Copy to clipboard
            navigator.clipboard.writeText(`${selectedMemory.title}\n\n${selectedMemory.story}`).then(() => {
                alert('Memory copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy to clipboard.');
            });
        }
    };

    const startRecognition = () => {
        if (!recognitionRef.current) {
            alert('Speech-to-text not supported.');
            return;
        }

        try {
            baseInputRef.current = input || '';
            lastFinalIndexRef.current = -1;
            lastFinalAggregateRef.current = '';
            recognitionRef.current.start();
        } catch (e) {
            console.warn('Failed to start recognition', e);
        }
    };

    const stopRecognition = () => {
        try {
            recognitionRef.current?.stop();
        } catch {}
    };

    return (
        <>
            {/* FULL SCREEN MODAL PORTAL */}
            {modalOpen && selectedMemory &&
                createPortal(
                    <div
                        onClick={closeMemory}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            className="max-w-2xl w-[90%] rounded-2xl bg-white p-10 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxHeight: '100vh', overflow: 'auto' }}
                        >
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedMemory.title}</h3>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">{selectedMemory.era}</p>
                                </div>
                                <button
                                    onClick={closeMemory}
                                    className="text-sm text-[#6b6b6b] px-3 py-1 rounded hover:bg-gray-100"
                                >
                                    Close
                                </button>
                            </div>

                            {selectedMemory.imageUrl && (
                                <div className="w-full rounded-2xl overflow-hidden border border-[#f4d3b4] shadow-sm mb-6">
                                    <img
                                        src={selectedMemory.imageUrl}
                                        alt={`Illustration of ${selectedMemory.title}`}
                                        className="w-full max-h-[320px] object-cover"
                                    />
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button
                                    onClick={readMemoryAloud}
                                    className="px-4 py-2 rounded-lg bg-[#db7758] text-white text-sm font-semibold hover:bg-[#c86245]"
                                >
                                    🔊 Read Memory
                                </button>
                                <button
                                    onClick={shareMemory}
                                    className="px-4 py-2 rounded-lg border-2 border-[#db7758] text-[#db7758] text-sm font-semibold hover:bg-[#ffe3dd]"
                                >
                                    📤 Share
                                </button>
                            </div>

                            <div className="mt-4 text-[#545454] text-lg leading-relaxed">
                                {selectedMemory.story}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* MAIN PAGE CONTENT */}
            <section className="px-4 py-12 pb-28 bg-[#FFFFF0]">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fde9dc] text-[#db7758] text-xs font-semibold uppercase tracking-[0.3em]">
                            <MemorySparkIcon />
                            Memory lane
                        </div>
                        <h2 className="text-3xl font-bold">A gentle place to keep stories</h2>
                        <p className="text-[#6b6b6b]">
                            Big text, warm colors, and patient buttons encourage elders to share even the smallest moments.
                        </p>
                    </div>

                    {/* input + save + mic */}
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                        <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">
                                Tell a memory in your own words
                            </label>

                            <textarea
                                value={input}
                                onChange={(event) => {
                                    setInput(event.target.value);
                                    baseInputRef.current = event.target.value;
                                }}
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
                                    onClick={() => {
                                        setInput('');
                                        baseInputRef.current = '';
                                    }}
                                    className="px-6 py-3 rounded-2xl border-2 border-[#f4d3b4] text-sm font-semibold text-[#6b6b6b]"
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    onClick={() => (recording ? stopRecognition() : startRecognition())}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold border-2 border-[#db7758] text-[#db7758] ${
                                        recording ? 'opacity-90 bg-[#fff1eb]' : ''
                                    }`}
                                >
                                    <MicIcon className={`text-xl ${recording ? 'animate-pulse' : ''}`} />
                                    <span>{recording ? 'Listening…' : 'Use mic'}</span>
                                </button>
                            </div>

                            <p className="text-sm text-[#6b6b6b]">
                                Saved notes stay simple so they can be printed or read aloud later.
                            </p>
                        </div>

                        {/* memories list */}
                        <div className="rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-6 space-y-4 max-h-[500px] overflow-y-auto">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Your story shelf</p>
                                <h3 className="text-xl font-bold">Recent memories</h3>
                            </div>

                            {memoryError && (
                                <div className="rounded-2xl bg-[#ffe3dd] border border-[#f1bfb2] px-4 py-3 text-sm text-[#a6523b]">
                                    {memoryError}
                                </div>
                            )}

                            {isLoadingMemories && (
                                <div className="rounded-2xl bg-[#fff6ea] border border-dashed border-[#f4d3b4] px-4 py-3 text-sm text-[#6b6b6b]">
                                    Loading your saved stories…
                                </div>
                            )}

                            {!isLoadingMemories && memories.length === 0 && !memoryError && (
                                <div className="rounded-2xl bg-[#fffaf0] border border-dashed border-[#f4d3b4] px-4 py-5 text-sm text-[#6b6b6b]">
                                    No memories saved yet. Share a story on the left and it will appear here for your care circle.
                                </div>
                            )}

                            {memories.map((memory, index) => (
                                <div
                                    key={`${memory.title}-${index}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openMemory(memory)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') openMemory(memory);
                                    }}
                                    className="rounded-2xl border border-[#f4d3b4] bg-[#fffaf0] p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    {memory.imageUrl && (
                                        <div className="rounded-2xl overflow-hidden border border-[#f6dcca] bg-white">
                                            <img
                                                src={memory.imageUrl}
                                                alt={`Memory illustration for ${memory.title}`}
                                                className="w-full h-40 object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <h4 className="text-lg font-semibold">{memory.title}</h4>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">{memory.era}</p>
                                    <p className="text-sm text-[#6b6b6b] leading-relaxed truncate">{memory.story}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.MemoriesTab = MemoriesTab;
