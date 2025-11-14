import { env } from '../env.js';
import { uploadAudioBuffer } from './storageService.js';
import { generateAudioPath } from '../lib/utils.js';

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

async function fetchAudioBlob(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Unable to download audio ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function transcribeAudio(audioUrl: string) {
  const audioBuffer = await fetchAudioBlob(audioUrl);
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'input.mp3');

  const res = await fetch(`${ELEVEN_BASE}/speech-to-text`, {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs STT failed: ${res.statusText}`);
  }
  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function synthesizeAudio(text: string) {
  const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${env.ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      output_format: 'mp3_22050_32',
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const path = generateAudioPath('entries');
  await uploadAudioBuffer(path, buffer, 'audio/mpeg');
  return path;
}
