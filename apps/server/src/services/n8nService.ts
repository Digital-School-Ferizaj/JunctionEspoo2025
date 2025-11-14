import { env } from '../env.js';

type CareStatus = 'GREEN' | 'AMBER' | 'RED';

export async function notifyCareCircle(payload: { user_id: string; status: CareStatus; message: string }) {
  await fetch(env.N8N_WEBHOOK_CARECIRCLE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function notifyShareSnippet(payload: { share_id: string; to_user_id: string; url: string }) {
  await fetch(env.N8N_WEBHOOK_SHARE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
