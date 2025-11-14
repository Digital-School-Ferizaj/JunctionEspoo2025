import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

router.get('/memories.json', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('memories')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('deleted', false)
    .order('ts', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ memories: data });
});

router.get('/memories.txt', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('memories')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('deleted', false)
    .order('ts', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  const lines = (data ?? []).map(
    (memory) => `Title: ${memory.summary_json?.title ?? 'Untitled'}\nEra: ${memory.era}\nQuote: ${memory.quote}\n---`,
  );
  res.setHeader('Content-Type', 'text/plain');
  return res.send(lines.join('\n'));
});

export default router;
