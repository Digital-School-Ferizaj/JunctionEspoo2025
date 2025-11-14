import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../supabase.js';
import { loginSchema, registerSchema } from '../lib/schemas.js';
import { signAccessToken, signRefreshToken, rotateRefreshToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    if (!payload.email || !payload.passcode) {
      return res.status(400).json({ error: 'Email and passcode required' });
    }
    const hash = await bcrypt.hash(payload.passcode, 10);
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: payload.email,
        passcode_hash: hash,
        name: payload.name ?? 'amily friend',
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    const access = signAccessToken(data.id);
    const refresh = signRefreshToken(data.id);
    return res.status(201).json({ token: access, refresh_token: refresh, user: data });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', payload.email)
      .single();
    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(payload.passcode, data.passcode_hash ?? '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const access = signAccessToken(data.id);
    const refresh = signRefreshToken(data.id);
    return res.json({ token: access, refresh_token: refresh, user: data });
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token: refreshToken } = req.body as { refresh_token?: string };
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token missing' });
  try {
    const tokens = rotateRefreshToken(refreshToken);
    return res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
