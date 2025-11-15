const { useState } = React;
const { ShieldIcon } = window.AmilyIcons;

function Hero({ darkMode, isLoggedIn, onNavigate }) {
    const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });

    const handleCardMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        setCardTilt({ rotateX, rotateY });
    };

    const handleCardMouseLeave = () => {
        setCardTilt({ rotateX: 0, rotateY: 0 });
    };

    return (
        <section id="home" className="relative pt-32 pb-24 overflow-hidden">
            <div
                className={`absolute inset-0 ${
                    darkMode
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
                        : 'bg-gradient-to-br from-rose-100 via-amber-50 to-sky-100'
                }`}
            />

            <div
                className={`absolute -top-24 -left-10 w-80 h-80 rounded-full mix-blend-screen blur-3xl opacity-40 animate-blob ${
                    darkMode ? 'bg-rose-500/60' : 'bg-rose-300/70'
                }`}
            />
            <div
                className={`absolute top-40 -right-10 w-80 h-80 rounded-full mix-blend-screen blur-3xl opacity-40 animate-blob animation-delay-2000 ${
                    darkMode ? 'bg-orange-500/60' : 'bg-orange-300/70'
                }`}
            />
            <div
                className={`absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-screen blur-3xl opacity-40 animate-blob animation-delay-4000 ${
                    darkMode ? 'bg-pink-500/60' : 'bg-pink-300/70'
                }`}
            />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)] items-center">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-[0.26em] mb-5 bg-black/5 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className={darkMode ? 'text-slate-200' : 'text-rose-600'}>
                                Built for calm, not speed
                            </span>
                        </div>

                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-[4rem] font-bold mb-4 leading-tight">
                            <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 bg-clip-text text-transparent drop-shadow-glow">
                                A safe space
                            </span>
                            <br />
                            <span className={darkMode ? 'text-slate-100' : 'text-slate-900'}>
                                for gentle conversations.
                            </span>
                        </h1>

                        <p
                            className={`text-base sm:text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed ${
                                darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                        >
                            Amily speaks slowly, listens carefully, and remembers the little things – so older
                            adults and their families can feel calmer, safer, and more connected every day.
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <button
                                type="button"
                                onClick={() => onNavigate(isLoggedIn ? 'wellness' : 'login')}
                                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white text-sm md:text-base font-semibold shadow-lg hover:shadow-2xl hover:scale-[1.03] active:scale-[0.99] transition-all duration-200"
                            >
                                <span>{isLoggedIn ? 'Try the daily check-in' : 'Log in'}</span>
                                <span className="group-hover:translate-x-1 transition-transform text-lg">→</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onNavigate(isLoggedIn ? 'safety' : 'signup')}
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-semibold border transition-all duration-200 ${
                                    darkMode
                                        ? 'bg-slate-900/60 border-slate-700 text-slate-100 hover:border-rose-400 hover:bg-slate-900/90'
                                        : 'bg-white/80 border-rose-200 text-rose-700 hover:bg-rose-50'
                                }`}
                            >
                                <ShieldIcon />
                                <span>{isLoggedIn ? 'See safety features' : 'Create an account'}</span>
                            </button>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                                    ✓
                                </span>
                                <span>Designed with elderly users in mind</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-400 text-xs">
                                    ✦
                                </span>
                                <span>Clear visuals & large, gentle typography</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="relative"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            transform: `perspective(900px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
                            transformStyle: 'preserve-3d',
                            transition: 'transform 150ms ease-out',
                        }}
                    >
                        <div
                            className={`relative rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${
                                darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-rose-100'
                            }`}
                        >
                            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                                        A
                                    </div>
                                    <div>
                                        <p className={darkMode ? 'text-slate-50 text-sm font-semibold' : 'text-slate-900 text-sm font-semibold'}>
                                            Amily · Companion
                                        </p>
                                        <p className={darkMode ? 'text-emerald-300 text-xs' : 'text-emerald-600 text-xs'}>
                                            Online · Listening gently
                                        </p>
                                    </div>
                                </div>
                                <span className={darkMode ? 'text-slate-500 text-xs' : 'text-slate-400 text-xs'}>Today · 9:04 AM</span>
                            </div>

                            <div className="p-5 space-y-4 max-h-72 overflow-hidden">
                                <div className="flex justify-start">
                                    <div className="max-w-xs rounded-2xl px-4 py-3 bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm shadow-md">
                                        Good morning... how are you feeling today?
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <div
                                        className={`max-w-xs rounded-2xl px-4 py-3 text-sm shadow-md ${
                                            darkMode
                                                ? 'bg-slate-950 border border-slate-700 text-slate-100'
                                                : 'bg-white border border-slate-200 text-slate-800'
                                        }`}
                                    >
                                        I feel a little lonely, but I am okay.
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="max-w-xs rounded-2xl px-4 py-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm shadow-md">
                                        Thank you for telling me... I am right here with you. We will take today slowly, one gentle step at a time.
                                    </div>
                                </div>
                                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Amily is speaking in a calm, steady voice…</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -left-6 w-28 h-28 rounded-3xl bg-gradient-to-br from-rose-400/80 to-orange-400/80 blur-3xl opacity-60 pointer-events-none" />
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/70 to-amber-400/70 blur-3xl opacity-60 pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
}

const HomeTab = ({ darkMode, isLoggedIn, onNavigate, features, FeatureCard }) => (
    <>
        <Hero darkMode={darkMode} isLoggedIn={isLoggedIn} onNavigate={onNavigate} />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} darkMode={darkMode} />
                ))}
            </div>
        </section>
    </>
);

window.AmilyTabs = window.AmilyTabs || {};
window.AmilyTabs.HomeTab = HomeTab;

