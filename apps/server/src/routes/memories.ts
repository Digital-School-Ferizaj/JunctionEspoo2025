import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { memoryCreateSchema, shareSchema } from '../lib/schemas.js';
import { transcribeAudio } from '../services/elevenLabsService.js';
import { generateMemory } from '../services/aiService.js';
import { notifyShareSnippet } from '../services/n8nService.js';
import { env } from '../env.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const payload = memoryCreateSchema.parse(req.body);
    if (!payload.audio_url && !payload.transcript) {
      return res.status(400).json({ error: 'audio_url or transcript required' });
    }
    let transcript = payload.transcript ?? '';
    if (!transcript && payload.audio_url) {
      transcript = await transcribeAudio(payload.audio_url);
    }
    const summary = await generateMemory(transcript);
    const { data, error } = await supabaseAdmin
      .from('memories')
      .insert({
        user_id: req.user!.id,
        audio_url: payload.audio_url,
        transcript,
        summary_json: summary,
        era: summary.era,
        tags: summary.tags,
        quote: summary.quote,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ memory: data, summary_json: summary });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '100', 10), 200);
  const { data, error } = await supabaseAdmin
    .from('memories')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('deleted', false)
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ memories: data });
});

router.post('/:id/share', async (req, res, next) => {
  try {
    const payload = shareSchema.parse(req.body);
    const memoryId = req.params.id;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('consent_share')
      .eq('id', req.user!.id)
      .single();
    if (!user?.consent_share) {
      return res.status(403).json({ error: 'Sharing disabled' });
    }
    const { data: share, error } = await supabaseAdmin
      .from('shares')
      .insert({
        memory_id: memoryId,
        to_user_id: payload.to_user_id,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    await supabaseAdmin.from('share_audit').insert({
      share_id: share.id,
      action: 'created',
      actor: req.user!.id,
    });
    const link = `${env.APP_BASE_URL}/share/${share.id}`;
    await notifyShareSnippet({ share_id: share.id, to_user_id: payload.to_user_id, url: link });
    return res.status(201).json({ share_id: share.id, link });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('memories')
    .update({ deleted: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).end();
});

export default router;
