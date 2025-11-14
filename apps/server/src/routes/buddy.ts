import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { buddyMessageSchema, buddyOptInSchema } from '../lib/schemas.js';
import { summarizeBuddy } from '../services/aiService.js';
import { transcribeAudio } from '../services/elevenLabsService.js';
import { moderateTranscript } from '../services/moderationService.js';

const router = Router();

async function findActiveBuddy(userId: string) {
  const { data } = await supabaseAdmin
    .from('buddies')
    .select('*')
    .eq('active', true)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .single();
  return data ?? null;
}

async function pairUsers(userId: string, interests: string[]) {
  const { data: candidates } = await supabaseAdmin
    .from('users')
    .select('id, interests')
    .eq('consent_peer', true)
    .neq('id', userId)
    .limit(20);
  if (!candidates) return null;

  for (const candidate of candidates) {
    const { data: buddyRecord } = await supabaseAdmin
      .from('buddies')
      .select('id')
      .eq('active', true)
      .or(`user_a.eq.${candidate.id},user_b.eq.${candidate.id}`);
    if (buddyRecord && buddyRecord.length > 0) continue;
    const overlap = interests.filter((interest) => candidate.interests?.includes?.(interest));
    if (overlap.length === 0) continue;
    const { data } = await supabaseAdmin
      .from('buddies')
      .insert({
        user_a: userId,
        user_b: candidate.id,
      })
      .select('*')
      .single();
    return data;
  }
  return null;
}

function computeStreak(messages: { ts: string }[]) {
  const days = new Set(
    messages.map((msg) => new Date(msg.ts).toISOString().split('T')[0]),
  );
  return Math.min(days.size, 30);
}

router.get('/', async (req, res) => {
  const buddy = await findActiveBuddy(req.user!.id);
  if (!buddy) {
    return res.json({ buddy: null, queued: true });
  }
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('buddy_id', buddy.id)
    .eq('deleted', false)
    .order('ts', { ascending: false })
    .limit(20);
  const { data: buddyProfile } = await supabaseAdmin
    .from('users')
    .select('id,name,interests')
    .eq('id', buddy.user_a === req.user!.id ? buddy.user_b : buddy.user_a)
    .single();
  return res.json({
    buddy: {
      id: buddy.id,
      partner: buddyProfile,
      since_ts: buddy.since_ts,
      active: buddy.active,
    },
    messages: messages ?? [],
    streak: computeStreak(messages ?? []),
  });
});

router.post('/opt-in', async (req, res, next) => {
  try {
    const payload = buddyOptInSchema.parse(req.body);
    await supabaseAdmin
      .from('users')
      .update({ consent_peer: true, interests: payload.interests })
      .eq('id', req.user!.id);
    let buddy = await findActiveBuddy(req.user!.id);
    if (!buddy) {
      buddy = await pairUsers(req.user!.id, payload.interests);
    }
    return res.json({ paired: Boolean(buddy), buddy });
  } catch (err) {
    return next(err);
  }
});

router.post('/leave', async (req, res) => {
  const buddy = await findActiveBuddy(req.user!.id);
  if (buddy) {
    await supabaseAdmin.from('buddies').update({ active: false }).eq('id', buddy.id);
  }
  await supabaseAdmin.from('users').update({ consent_peer: false }).eq('id', req.user!.id);
  return res.status(204).end();
});

router.post('/message', async (req, res, next) => {
  try {
    const payload = buddyMessageSchema.parse(req.body);
    const buddy = await findActiveBuddy(req.user!.id);
    if (!buddy) {
      return res.status(400).json({ error: 'No buddy' });
    }
    let transcript = (req.body as { transcript?: string }).transcript;
    if (!transcript) {
      transcript = await transcribeAudio(payload.audio_url);
    }
    const moderation = moderateTranscript(transcript);
    if (moderation.flagged) {
      return res.status(400).json({ error: moderation.warning });
    }
    const summary = await summarizeBuddy(transcript);
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        buddy_id: buddy.id,
        from_user: req.user!.id,
        audio_url: payload.audio_url,
        transcript,
        summary_json: summary,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: data, summary_json: summary });
  } catch (err) {
    return next(err);
  }
});

router.post('/block', async (req, res) => {
  const buddy = await findActiveBuddy(req.user!.id);
  if (buddy) {
    await supabaseAdmin.from('buddies').update({ active: false }).eq('id', buddy.id);
  }
  await supabaseAdmin.from('users').update({ consent_peer: false }).eq('id', req.user!.id);
  return res.status(204).end();
});

export default router;
