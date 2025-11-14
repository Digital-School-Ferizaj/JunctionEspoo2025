import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import PlanCard from '../components/PlanCard';
import { fallbackDemo } from '../data/demoFlow';
const loadFlow = () => {
    const stored = localStorage.getItem('amily-demo-flow');
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch {
            return fallbackDemo;
        }
    }
    return fallbackDemo;
};
export default function DemoReplayScreen() {
    const [flow, setFlow] = useState(loadFlow);
    return (_jsxs("div", { className: "screen", children: [_jsx("h1", { children: "Offline Demo Replay" }), _jsx("p", { children: "Replays the last successful flow with zero network calls." }), _jsxs("div", { className: "card", children: [_jsx("button", { className: "primary-btn", onClick: () => setFlow(loadFlow()), children: "Replay last saved flow" }), _jsx("button", { onClick: () => setFlow(fallbackDemo), children: "Use fallback sample" })] }), _jsxs("section", { style: { marginTop: 24 }, children: [_jsx("h2", { children: "Transcript" }), _jsx("p", { children: flow.transcript })] }), flow.plan && (_jsxs("section", { style: { marginTop: 24 }, children: [_jsx("h2", { children: "Plan" }), _jsx(PlanCard, { summary: flow.plan.summary, next: flow.plan.next_step, mood: flow.plan.mood, tags: flow.plan.tags })] })), flow.memory && (_jsxs("section", { style: { marginTop: 24 }, children: [_jsx("h2", { children: "MemoryLane" }), _jsx("p", { children: flow.memory.story_3_sentences }), _jsx("blockquote", { children: flow.memory.quote })] })), flow.buddy && (_jsxs("section", { style: { marginTop: 24 }, children: [_jsx("h2", { children: "Buddy summary" }), _jsxs("p", { children: [flow.buddy.summary, " \u2022 ", flow.buddy.suggestion] })] }))] }));
}
