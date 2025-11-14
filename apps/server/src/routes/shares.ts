import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('shares')
    .select('*, memories!inner(summary_json, user_id)')
    .eq('memories.user_id', req.user!.id)
    .eq('revoked', false);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ shares: data });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('shares')
    .select('*, memories!inner(summary_json,user_id,quote,era)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  const isOwner = data.memories.user_id === req.user!.id;
  const isRecipient = data.to_user_id === req.user!.id;
  if (!isOwner && !isRecipient) return res.status(403).json({ error: 'Forbidden' });
  return res.json({ share: data });
});

router.delete('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('shares').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  if (data.revoked) return res.status(204).end();
  const { data: memory } = await supabaseAdmin
    .from('memories')
    .select('user_id')
    .eq('id', data.memory_id)
    .single();
  if (memory?.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await supabaseAdmin.from('shares').update({ revoked: true }).eq('id', req.params.id);
  await supabaseAdmin.from('share_audit').insert({
    share_id: data.id,
    action: 'revoked',
    actor: req.user!.id,
  });
  return res.status(204).end();
});

export default router;
