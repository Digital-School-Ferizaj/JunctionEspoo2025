import { z } from 'zod';

export const moodEnum = z.enum(['low', 'ok', 'good']);

export const PlanSchema = z.object({
  summary: z.string().min(4).max(500),
  next_step: z.string().min(3).max(280),
  mood: moodEnum,
  tags: z
    .array(
      z
        .string()
        .min(2)
        .max(32)
        .transform((tag) => tag.toLowerCase()),
    )
    .max(6),
});

export type PlanJSON = z.infer<typeof PlanSchema>;

export const MemorySchema = z.object({
  title: z.string().min(3).max(120),
  era: z.string().min(3).max(64),
  story_3_sentences: z.string().min(12).max(700),
  tags: z
    .array(
      z
        .string()
        .min(2)
        .max(32)
        .transform((tag) => tag.toLowerCase()),
    )
    .max(8),
  quote: z.string().min(3).max(200),
});

export type MemoryJSON = z.infer<typeof MemorySchema>;

export const SummarySchema = z.object({
  summary: z.string().min(5).max(400),
  tone: z.enum(['warm', 'neutral']),
  suggestion: z.string().min(5).max(280),
});

export type SummaryJSON = z.infer<typeof SummarySchema>;

export const registerSchema = z.object({
  email: z.string().email().optional(),
  passcode: z.string().min(4).max(12).optional(),
  name: z.string().min(2).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  passcode: z.string().min(4).max(12),
});

export const entryCreateSchema = z.object({
  audio_url: z.string().url().optional(),
  transcript: z.string().min(5).max(4000).optional(),
});

export const memoryCreateSchema = z.object({
  audio_url: z.string().url().optional(),
  transcript: z.string().min(5).max(6000).optional(),
});

export const buddyOptInSchema = z.object({
  interests: z.array(z.string()).min(1).max(6),
});

export const buddyMessageSchema = z.object({
  audio_url: z.string().url(),
});

export const shareSchema = z.object({
  to_user_id: z.string().uuid(),
});

export type UserAuthPayload = {
  user_id: string;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item)))
      .map((t) => t.toLowerCase());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => chunk.toLowerCase());
  }
  return [];
}

export function coercePlanJson(raw: unknown): PlanJSON {
  const candidate =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return {};
          }
        })()
      : raw;

  const refined = {
    ...candidate,
    tags: normalizeArray(candidate?.tags ?? []),
    mood: typeof candidate?.mood === 'string' ? candidate.mood.toLowerCase() : 'ok',
  };

  return PlanSchema.parse(refined);
}

export function coerceMemoryJson(raw: unknown): MemoryJSON {
  const candidate =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return {};
          }
        })()
      : raw;

  return MemorySchema.parse({
    ...candidate,
    tags: normalizeArray(candidate?.tags ?? []),
  });
}

export function coerceSummaryJson(raw: unknown): SummaryJSON {
  const candidate =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return {};
          }
        })()
      : raw;
  return SummarySchema.parse(candidate);
}
