import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it, vi } from 'vitest';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.ELEVENLABS_API_KEY = 'eleven';
process.env.ELEVENLABS_VOICE_ID = 'voice';
process.env.FEATHERLESS_API_KEY = 'feather';
process.env.FEATHERLESS_MODEL = 'llama';
process.env.LLM_PROVIDER = 'featherless';
process.env.N8N_WEBHOOK_CARECIRCLE_URL = 'https://hooks/n8n/care';
process.env.N8N_WEBHOOK_SHARE_URL = 'https://hooks/n8n/share';
process.env.JWT_SECRET = 'supersecretjwtkeythatneedstobelong';
process.env.JWT_REFRESH_SECRET = 'refreshsecretjwtkeythatneedstobelong';
process.env.TOKEN_TTL_MINUTES = '15';
process.env.REFRESH_TTL_HOURS = '12';
process.env.APP_BASE_URL = 'http://localhost:5173';
process.env.STORAGE_BUCKET = 'audio';

vi.mock('../src/services/aiService.js', () => ({
  generatePlan: vi.fn().mockResolvedValue({
    summary: 'Morning stretch completed.',
    next_step: 'Call Maria tonight.',
    mood: 'good',
    tags: ['social'],
  }),
  generateMemory: vi.fn(),
  summarizeBuddy: vi.fn(),
}));

describe('E2E happy path', () => {
  let app: import('express').Express;
  let token: string;

  beforeAll(async () => {
    const mod = await import('../src/app.js');
    app = mod.createApp();
    token = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  });

  it('generates plan JSON via API', async () => {
    const res = await request(app)
      .post('/api/v1/ai/plan')
      .set('Authorization', `Bearer ${token}`)
      .send({ transcript: 'I walked today and felt strong.' });
    expect(res.status).toBe(200);
    expect(res.body.next_step).toContain('Call');
  });
});
