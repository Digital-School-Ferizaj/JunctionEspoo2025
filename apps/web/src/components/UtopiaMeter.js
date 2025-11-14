import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function UtopiaMeter({ streak, social, activity }) {
    const total = Math.min(100, streak * 5 + social * 10 + activity * 10);
    const status = total > 70 ? 'glow' : total > 40 ? 'steady' : 'gentle';
    return (_jsxs("div", { className: "card", "aria-label": "Utopia Meter", children: [_jsxs("div", { className: "meter", children: [_jsx("span", { children: "Utopia Meter" }), _jsxs("strong", { children: [total, "%"] })] }), _jsxs("p", { children: ["Status: ", status] }), _jsxs("p", { children: ["Streak ", streak, " day(s) \u2022 Social ", social, " \u2022 Activity ", activity] })] }));
}
