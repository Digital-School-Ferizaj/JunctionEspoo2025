const { SparklesIcon, ShieldIcon, ActivityIcon, MemorySparkIcon, BuddyIcon, ChatBubbleIcon } = window.AmilyIcons;

function HomeTab({ onNavigate, features, FeatureCard }) {
    const highlights = [
        { label: 'Built for families', detail: 'Invite relatives to follow wellness updates.' },
        { label: 'Voice & touch ready', detail: 'Large buttons and slow, caring responses.' },
        { label: 'Safety layer', detail: 'Emergency contacts always one tap away.' },
        { label: 'Trusted data', detail: 'Private by default and easy to share.' },
    ];

    const previewTabs = [
        { icon: MemorySparkIcon, label: 'Memories', description: 'Record small stories and photos.' },
        { icon: ActivityIcon, label: 'Wellness', description: 'See mood, sleep, and gentle reminders.' },
        { icon: ChatBubbleIcon, label: 'Chat', description: 'Talk to Amily or send a quick text.' },
        { icon: ShieldIcon, label: 'Safety', description: 'Tap to call family, doctor, or emergency.' },
        { icon: BuddyIcon, label: 'Buddy', description: 'Meet neighbors with similar interests.' },
    ];

    return (
        <div className="bg-[#FFFFF0] text-[#545454]">
            <section className="px-4 pt-20 pb-16">
                <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">
                            <SparklesIcon />
                            Two spaces. One calm companion.
                        </span>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight">A welcoming website and a gentle daily app.</h1>
                            <p className="mt-4 text-lg text-[#6b6b6b]">
                                Families discover Amily on this page. Elders enjoy the simplified platform after signing in.
                                Every screen was drawn for shaky hands, tired eyes, and hearts that prefer patience.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={() => onNavigate('login')}
                                className="px-6 py-3 rounded-2xl bg-[#db7758] text-white font-semibold shadow-md hover:bg-[#c86245] transition-colors"
                            >
                                Sign in to the platform
                            </button>
                            <button
                                type="button"
                                onClick={() => onNavigate('signup')}
                                className="px-6 py-3 rounded-2xl border-2 border-[#db7758] text-[#db7758] font-semibold hover:bg-white transition-colors"
                            >
                                Create a family account
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {highlights.map((item) => (
                                <div key={item.label} className="rounded-2xl bg-white/80 border border-[#f4d3b4] p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#db7758]">{item.label}</p>
                                    <p className="mt-2 text-sm leading-relaxed">{item.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-[32px] border border-[#f4d3b4] bg-white shadow-xl p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-[#db7758] uppercase tracking-[0.2em]">Platform preview</p>
                            <h3 className="mt-2 text-2xl font-bold">Five simple tabs guide every day</h3>
                            <p className="text-sm text-[#6b6b6b]">
                                After sign in, the home page is replaced with this calm layout. Each tab mirrors a real-life need.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {previewTabs.map((tab) => (
                                <div key={tab.label} className="rounded-2xl border border-[#f4d3b4] p-4 bg-[#fffaf0] flex flex-col gap-3">
                                    <div className="inline-flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-[#fde9dc] text-[#db7758]">
                                            <tab.icon />
                                        </div>
                                        <span className="font-semibold">{tab.label}</span>
                                    </div>
                                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{tab.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl bg-[#fef6e0] border border-[#f5d5c2] p-4 text-sm leading-relaxed">
                            <p className="font-semibold text-[#db7758]">Mobile first</p>
                            <p>
                                The platform opens with a bottom tab bar on phones, with Chat in the center. Larger screens keep the same order for
                                familiarity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-16">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">What elders see after signing in</h2>
                        <p className="mt-2 text-lg text-[#6b6b6b]">Each card below becomes one of the in-app tabs.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto rounded-[32px] border border-[#f4d3b4] bg-white/90 shadow-lg p-8 space-y-8">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#db7758]">Gentle roll-out</p>
                        <h3 className="text-2xl font-bold">Simple steps toward calm support</h3>
                        <p className="text-sm text-[#6b6b6b]">
                            We removed extra screens and complicated check-ins. Everything now fits into the five-tab layout.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { title: 'Invite & explain', detail: 'Start with the family-friendly homepage. Show the five tabs using your own words.' },
                            { title: 'Sign in together', detail: 'Use the large sign-in form. Once authenticated the homepage disappears automatically.' },
                            { title: 'Let habits grow', detail: 'Wellness and Buddy tabs act like a profile, so elders recognize their place.' },
                        ].map((step, idx) => (
                            <div key={step.title} className="rounded-2xl p-4 bg-[#fffaf0] border border-[#f4d3b4] space-y-2">
                                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#db7758] text-white font-semibold">
                                    {idx + 1}
                                </span>
                                <h4 className="text-lg font-bold">{step.title}</h4>
                                <p className="text-sm text-[#6b6b6b] leading-relaxed">{step.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.HomeTab = HomeTab;
