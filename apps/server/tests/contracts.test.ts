import { describe, expect, it } from 'vitest';
import { PlanSchema, MemorySchema, SummarySchema, coercePlanJson } from '../src/lib/schemas.js';

describe('AI contract schemas', () => {
  it('validates PlanJSON', () => {
    const payload = {
      summary: 'Morning walk complete and called neighbor.',
      next_step: 'Send a photo to Anita this afternoon.',
      mood: 'good',
      tags: ['social', 'mobility'],
    };
    expect(() => PlanSchema.parse(payload)).not.toThrow();
  });

  it('repairs PlanJSON when needed', () => {
    const payload = {
      summary: 'Did stretches',
      next_step: 'Drink water',
      mood: 'GOOD',
      tags: 'routine,health',
    };
    const parsed = coercePlanJson(payload);
    expect(parsed.mood).toBe('good');
    expect(parsed.tags).toEqual(['routine', 'health']);
  });

  it('validates MemoryJSON', () => {
    const payload = {
      title: 'Summer on the coast',
      era: '1960s',
      story_3_sentences: 'We packed the car and drove to the coast. The air was filled with salt. We laughed the entire time.',
      tags: ['travel'],
      quote: '“Those waves carried our plans.”',
    };
    expect(() => MemorySchema.parse(payload)).not.toThrow();
  });

  it('validates SummaryJSON', () => {
    const payload = {
      summary: 'Buddy felt calm and read a new poem today.',
      tone: 'warm',
      suggestion: 'Reply with a short message sharing a poem you enjoy.',
    };
    expect(() => SummarySchema.parse(payload)).not.toThrow();
  });
});
