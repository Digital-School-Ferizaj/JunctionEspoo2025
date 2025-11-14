import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .default('4000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  ELEVENLABS_API_KEY: z.string(),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
  FEATHERLESS_API_KEY: z.string(),
  FEATHERLESS_MODEL: z.string().default('llama-3.1-8b-instruct'),
  OLLAMA_BASE_URL: z.string().url().optional(),
  LLM_PROVIDER: z.enum(['featherless', 'ollama']).default('featherless'),
  N8N_WEBHOOK_CARECIRCLE_URL: z.string().url(),
  N8N_WEBHOOK_SHARE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  TOKEN_TTL_MINUTES: z.string().default('15'),
  REFRESH_TTL_HOURS: z.string().default('12'),
  APP_BASE_URL: z.string().url(),
  STORAGE_BUCKET: z.string().default('audio'),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  PORT: typeof parsed.PORT === 'number' ? parsed.PORT : 4000,
  TOKEN_TTL_MINUTES: parseInt(parsed.TOKEN_TTL_MINUTES, 10),
  REFRESH_TTL_HOURS: parseInt(parsed.REFRESH_TTL_HOURS, 10),
};

export type Env = typeof env;
