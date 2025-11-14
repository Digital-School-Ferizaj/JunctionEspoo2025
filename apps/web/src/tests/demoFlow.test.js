import { describe, expect, it } from 'vitest';
import { fallbackDemo } from '../data/demoFlow';
describe('fallback demo flow', () => {
    it('contains plan, memory, and buddy summaries', () => {
        expect(fallbackDemo.plan.summary).toBeTruthy();
        expect(fallbackDemo.memory.quote).toContain('“');
        expect(fallbackDemo.buddy.tone).toBe('warm');
    });
});
