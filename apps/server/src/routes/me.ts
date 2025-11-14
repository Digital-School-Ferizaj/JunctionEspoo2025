import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  interests: z.array(z.string()).optional(),
  consent_peer: z.boolean().optional(),
  consent_share: z.boolean().optional(),
});

router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', req.user!.id).single();
  if (error || !data) return res.status(404).json({ error: 'User not found' });
  return res.json(data);
});

router.patch('/', async (req, res, next) => {
  try {
    const payload = updateSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('id', req.user!.id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

export default router;
