import { Router } from 'express';
import type { Multer } from 'multer';
import { mediaLimiter } from '../middleware/rateLimits.js';
import { uploadAudioBuffer, createSignedUrl } from '../services/storageService.js';
import { ensureDurationMs, generateAudioPath } from '../lib/utils.js';

type Kind = 'entries' | 'memories' | 'messages';

const allowedKinds: Kind[] = ['entries', 'memories', 'messages'];

export default function mediaRoutes(upload: Multer) {
  const router = Router();

  router.post(
    '/upload-audio',
    mediaLimiter,
    upload.single('file'),
    async (req, res): Promise<void> => {
      const kind = (req.body.kind as Kind) || 'entries';
      if (!allowedKinds.includes(kind)) {
        res.status(400).json({ error: 'Invalid kind' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'File missing' });
        return;
      }
      const path = generateAudioPath(kind);
      await uploadAudioBuffer(path, req.file.buffer, req.file.mimetype || 'audio/mpeg');
      const signed = await createSignedUrl(path);
      res.json({
        audio_url: path,
        signed_url: signed,
        duration_ms: ensureDurationMs(req.body.duration_ms),
      });
    },
  );

  router.get('/stream/:id', mediaLimiter, async (req, res) => {
    try {
      const storagePath = Buffer.from(req.params.id, 'base64url').toString('utf-8');
      const signed = await createSignedUrl(storagePath);
      res.redirect(signed);
    } catch {
      res.status(400).json({ error: 'Invalid reference' });
    }
  });

  return router;
}
