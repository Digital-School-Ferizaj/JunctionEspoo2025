import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PlanCard({ summary, next, mood, tags }) {
    return (_jsxs("section", { className: "card", "aria-live": "polite", children: [_jsx("h2", { children: "Today's plan" }), _jsxs("p", { children: [_jsx("strong", { children: "Summary \u2022 " }), summary] }), _jsxs("p", { children: [_jsx("strong", { children: "Next small step \u2022 " }), next] }), _jsxs("p", { children: [_jsx("strong", { children: "Mood \u2022 " }), mood] }), _jsx("div", { style: { marginTop: 12 }, children: (tags ?? []).map((tag) => (_jsxs("span", { style: { marginRight: 8, fontSize: '0.9rem' }, children: ["#", tag] }, tag))) })] }));
}
