import { Router } from 'express';
import { aiLimiter } from '../middleware/rateLimits.js';
import { transcribeAudio, synthesizeAudio } from '../services/elevenLabsService.js';
import { generatePlan, generateMemory, summarizeBuddy } from '../services/aiService.js';
import { createSignedUrl } from '../services/storageService.js';
import { entryCreateSchema, memoryCreateSchema } from '../lib/schemas.js';

const router = Router();

router.post('/stt', aiLimiter, async (req, res, next) => {
  try {
    const { audio_url: audioUrl } = entryCreateSchema.pick({ audio_url: true }).parse(req.body);
    if (!audioUrl) return res.status(400).json({ error: 'audio_url required' });
    const transcript = await transcribeAudio(audioUrl);
    return res.json({ transcript });
  } catch (err) {
    return next(err);
  }
});

router.post('/tts', aiLimiter, async (req, res, next) => {
  try {
    const { text } = (req.body ?? {}) as { text?: string };
    if (!text) return res.status(400).json({ error: 'text required' });
    const path = await synthesizeAudio(text);
    const signed = await createSignedUrl(path);
    return res.json({ audio_url: path, signed_url: signed });
  } catch (err) {
    return next(err);
  }
});

router.post('/plan', aiLimiter, async (req, res, next) => {
  try {
    const { transcript } = entryCreateSchema
      .pick({ transcript: true })
      .required()
      .parse(req.body);
    const plan = await generatePlan(transcript!);
    return res.json(plan);
  } catch (err) {
    return next(err);
  }
});

router.post('/memory', aiLimiter, async (req, res, next) => {
  try {
    const { transcript } = memoryCreateSchema
      .pick({ transcript: true })
      .required()
      .parse(req.body);
    const summary = await generateMemory(transcript!);
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
});

router.post('/summarize-note', aiLimiter, async (req, res, next) => {
  try {
    const { transcript } = entryCreateSchema
      .pick({ transcript: true })
      .required()
      .parse(req.body);
    const summary = await summarizeBuddy(transcript!);
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
});

export default router;
