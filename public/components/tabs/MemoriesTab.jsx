const { useState, useEffect, useRef } = React;
const { MemorySparkIcon, SaveIcon } = window.AmilyIcons;
const { createPortal } = ReactDOM;

function MemoriesTab() {
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

    const [memories, setMemories] = useState([
        {
            title: 'The old oak tree',
            era: 'Childhood - 1950s',
            story: 'My brother and I climbed the oak tree near the river every Sunday. We counted clouds and felt brave.',
        },
    ]);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);

    const saveMemory = async () => {
        if (!input.trim()) {
            alert('Please share a memory first.');
            return;
        }

        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'local-user', storyInput: input.trim() }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data || !data.success) {
                const title = generateTitleFromStory(input.trim());
                setMemories((prev) => [
                    { title, era: new Date().toLocaleDateString(), story: input.trim() },
                    ...prev,
                ]);
                setInput('');
                baseInputRef.current = '';
                return;
            }

            const mem = data.data || { title: generateTitleFromStory(input.trim()), story: input.trim() };

            setMemories((prev) => [
                {
                    title: mem.title || generateTitleFromStory(input.trim()),
                    era: mem.era || new Date().toLocaleDateString(),
                    story: mem.story_3_sentences ? mem.story_3_sentences : input.trim(),
                    imageUrl: mem.imageUrl || null,
                },
                ...prev,
            ]);

            setInput('');
            baseInputRef.current = '';
        } catch (err) {
            console.warn('Save memory failed:', err);
            const title = generateTitleFromStory(input.trim());
            setMemories((prev) => [
                { title, era: new Date().toLocaleDateString(), story: input.trim() },
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
            // Directly request TTS for the story text only
            const ttsRes = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: selectedMemory.story }),
            }).catch(() => null);

            if (ttsRes && ttsRes.ok) {
                const data = await ttsRes.json();
                if (data.audioUrl) {
                    const audio = new Audio(data.audioUrl);
                    audio.play().catch((err) => console.warn('Audio playback failed:', err));
                }
                return;
            }

            // Fallback: use the services generateTTS directly via a simple fetch
            // This won't work without a server endpoint, so show a simpler approach:
            // Use the memory endpoint but ensure it only returns TTS of the story
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'memory-reader',
                    storyInput: selectedMemory.story,
                }),
            });

            const data = await res.json();
            // The response includes audioUrl for the TTS of the story
            if (data.audioUrl) {
                const audio = new Audio(data.audioUrl);
                audio.play().catch((err) => console.warn('Audio playback failed:', err));
            }
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
                                    className={`px-6 py-3 rounded-2xl font-semibold border-2 border-[#db7758] text-[#db7758] ${
                                        recording ? 'opacity-90' : ''
                                    }`}
                                >
                                    {recording ? 'Listening...' : 'Use microphone'}
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

                            {memories.map((memory, index) => (
                                <div
                                    key={`${memory.title}-${index}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openMemory(memory)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') openMemory(memory);
                                    }}
                                    className="rounded-2xl border border-[#f4d3b4] bg-[#fffaf0] p-4 space-y-2 cursor-pointer"
                                >
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
