import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { entryCreateSchema } from '../lib/schemas.js';
import { transcribeAudio } from '../services/elevenLabsService.js';
import { generatePlan } from '../services/aiService.js';
import { notifyCareCircle } from '../services/n8nService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const payload = entryCreateSchema.parse(req.body);
    if (!payload.audio_url && !payload.transcript) {
      return res.status(400).json({ error: 'audio_url or transcript required' });
    }
    let transcript = payload.transcript ?? '';
    if (!transcript && payload.audio_url) {
      transcript = await transcribeAudio(payload.audio_url);
    }
    const plan = await generatePlan(transcript);
    const { data, error } = await supabaseAdmin
      .from('entries')
      .insert({
        user_id: req.user!.id,
        audio_url: payload.audio_url,
        transcript,
        plan_json: plan,
        mood: plan.mood,
        tags: plan.tags,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, consent_share')
      .eq('id', req.user!.id)
      .single();

    if (user?.consent_share) {
      await notifyCareCircle({
        user_id: req.user!.id,
        status: plan.mood === 'good' ? 'GREEN' : plan.mood === 'ok' ? 'AMBER' : 'RED',
        message: plan.summary,
      });
    }

    return res.status(201).json({ entry: data, plan_json: plan });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '30', 10), 60);
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('deleted', false)
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ entries: data });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('entries')
    .update({ deleted: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).end();
});

export default router;
