import { env } from '../env.js';
import { stripPii } from '../lib/utils.js';
import {
  PlanSchema,
  MemorySchema,
  SummarySchema,
  coercePlanJson,
  coerceMemoryJson,
  coerceSummaryJson,
  PlanJSON,
  MemoryJSON,
  SummaryJSON,
} from '../lib/schemas.js';

type SchemaTarget = 'plan' | 'memory' | 'summary';

const prompts: Record<SchemaTarget, string> = {
  plan: `You are amily, a warm wellbeing companion. Read the sanitized transcript and produce STRICT JSON matching:
{
  "summary": "string",
  "next_step": "string",
  "mood": "low|ok|good",
  "tags": ["routine","social","mobility"]
}
Keep tone calm, optimistic, and actionable.`,
  memory: `You are archiving a cherished story. Respond using STRICT JSON that matches:
{
  "title": "string",
  "era": "string",
  "story_3_sentences": "string",
  "tags": ["travel","family","work"],
  "quote": "string"
}
Quote must be a real sentence excerpt.`,
  summary: `You help summarize buddy check-ins. Output STRICT JSON matching:
{
  "summary": "string",
  "tone": "warm|neutral",
  "suggestion": "string"
}`,
};

async function callFeatherless(transcript: string, target: SchemaTarget) {
  const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.FEATHERLESS_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You reply with strict JSON only.' },
        { role: 'user', content: `${prompts[target]}\nTranscript:\n${transcript}` },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Featherless error: ${response.statusText}`);
  }
  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '{}';
}

async function callOllama(transcript: string, target: SchemaTarget) {
  if (!env.OLLAMA_BASE_URL) throw new Error('OLLAMA_BASE_URL missing');
  const response = await fetch(`${env.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1',
      stream: false,
      messages: [
        { role: 'system', content: 'Reply with JSON only.' },
        { role: 'user', content: `${prompts[target]}\nTranscript:\n${transcript}` },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }
  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? '{}';
}

async function callModel(transcript: string, target: SchemaTarget) {
  const sanitized = stripPii(transcript);
  if (env.LLM_PROVIDER === 'ollama') {
    return callOllama(sanitized, target);
  }
  try {
    return await callFeatherless(sanitized, target);
  } catch (err) {
    if (env.OLLAMA_BASE_URL) {
      return callOllama(sanitized, target);
    }
    throw err;
  }
}

export async function generatePlan(transcript: string): Promise<PlanJSON> {
  const raw = await callModel(transcript, 'plan');
  return coercePlanJson(raw);
}

export async function generateMemory(transcript: string): Promise<MemoryJSON> {
  const raw = await callModel(transcript, 'memory');
  return coerceMemoryJson(raw);
}

export async function summarizeBuddy(transcript: string): Promise<SummaryJSON> {
  const raw = await callModel(transcript, 'summary');
  return coerceSummaryJson(raw);
}
