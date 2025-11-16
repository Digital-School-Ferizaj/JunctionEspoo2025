/**
 * Service Integrations
 * 
 * Handles all external API calls - requires real API keys and database
 */

import crypto from 'crypto';
import { config } from './config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { detectEmotion, generateEmpatheticResponse } from './persona';

export const GEMINI_CHAT_MODEL = 'gemini-2.0-flash';
export const ELEVENLABS_TTS_MODEL = 'eleven_monolingual_v1';

// Supabase client (only initialized in prod mode when keys are present)
let supabase: SupabaseClient | null = null;

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
type TokenRecord = { userId: string; expiresAt: number };
const activeTokens = new Map<string, TokenRecord>();

if (config.keys.supabaseUrl && config.keys.supabaseKey) {
  try {
    supabase = createClient(config.keys.supabaseUrl, config.keys.supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('💾 Supabase client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('Supabase URL/key missing – database features will not be available.');
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = (password: string, salt: string) => {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
};

const generateSalt = () => crypto.randomBytes(16).toString('hex');

const generateUserId = () => crypto.randomUUID();

const deriveDemoUserId = (email: string) =>
  `demo-${crypto.createHash('sha1').update(normalizeEmail(email)).digest('hex')}`;

const isUndefinedColumnError = (error: any) => error?.code === '42703';

export const issueAuthToken = (userId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
};

export const resolveUserIdFromToken = (token?: string | null): string | null => {
  if (!token) return null;
  const record = activeTokens.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    activeTokens.delete(token);
    return null;
  }
  return record.userId;
};

export const revokeAuthToken = (token: string) => {
  activeTokens.delete(token);
};

/**
 * ElevenLabs TTS Integration
 * (single source of "generation" now – no demo audio)
 */
export async function generateTTS(text: string): Promise<string> {
  if (!config.keys.elevenLabs) {
    throw new Error('ELEVENLABS_API_KEY is missing – cannot generate audio.');
  }
  try {
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default "Rachel" voice from ElevenLabs docs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.keys.elevenLabs,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_TTS_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('ElevenLabs API error:', response.status, errText);
      throw new Error(
        `ElevenLabs API error: ${response.status} ${errText || ''}`.trim()
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;
    console.log(`🎵 [PROD] Generated TTS via ElevenLabs for: "${text.substring(0, 50)}..."`);
    return dataUrl;
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    throw error;
  }
}

/**
 * Supabase Database Integration
 */
export async function saveToSupabase(table: string, data: any): Promise<boolean> {
  if (!supabase) {
    console.warn(`⚠️ Supabase not initialized – cannot save to "${table}"`);
    return false;
  }
  
  try {
    const { error } = await supabase.from(table).insert(data);
    if (error) {
      // Handle missing table gracefully (PGRST205 = table not found)
      if (error.code === 'PGRST205') {
        console.warn(`⚠️ Table "${table}" does not exist in database. Skipping save.`);
        return false;
      }
      console.error(`Supabase insert error on table "${table}":`, error);
      return false;
    }

    console.log(`💾 Saved record to Supabase table "${table}"`);
    return true;
  } catch (error) {
    console.error(`Supabase error saving to "${table}":`, error);
    return false;
  }
}

/**
 * Supabase Auth: Sign up a new user with email/password
 */
type AuthResult = { success: boolean; userId?: string; token?: string; error?: string };

const issueDemoAuthResult = (email: string): AuthResult => {
  const userId = deriveDemoUserId(email);
  const token = issueAuthToken(userId);
  return { success: true, userId, token };
};

export async function signUpUser(params: {
  email: string;
  password: string;
  fullName?: string;
  supportedPerson?: string;
}): Promise<AuthResult> {
  if (!supabase) {
    console.warn('Supabase client not initialized – using demo signup fallback.');
    return issueDemoAuthResult(params.email);
  }

  try {
    const email = normalizeEmail(params.email);
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing?.id) {
      return { success: false, error: 'Account already exists for this email.' };
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);
    const userId = generateUserId();

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      password_salt: salt,
      full_name: params.fullName ?? null,
      supported_person: params.supportedPerson ?? null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      if (isUndefinedColumnError(insertError)) {
        console.warn('Supabase users table missing credential columns – using demo signup fallback.');
        return issueDemoAuthResult(params.email);
      }
      console.error('Supabase users insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    // Create a preferences row for this user
    await saveToSupabase('user_preferences', {
      user_id: userId,
      preferred_pace: 'slow',
      favorite_time: 'morning',
      interests: [],
      routine_notes: null,
    });

    const token = issueAuthToken(userId);
    return { success: true, userId, token };
  } catch (error: any) {
    console.error('Unexpected signUp error:', error);
    return issueDemoAuthResult(params.email);
  }
}

/**
 * Supabase Auth: Log in an existing user with email/password
 */
export async function signInUser(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  if (!supabase) {
    console.warn('Supabase client not initialized – using demo login fallback.');
    return issueDemoAuthResult(params.email);
  }

  try {
    const email = normalizeEmail(params.email);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash, password_salt')
      .eq('email', email)
      .maybeSingle();

    if (isUndefinedColumnError(error)) {
      console.warn('Supabase users table missing credential columns – using demo login fallback.');
      return issueDemoAuthResult(params.email);
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase users select error:', error);
      return { success: false, error: error.message };
    }

    if (!user?.id || !user.password_hash || !user.password_salt) {
      console.warn('Supabase user not found or missing credentials – using demo login fallback.');
      return issueDemoAuthResult(params.email);
    }

    const calculatedHash = hashPassword(params.password, user.password_salt);
    if (calculatedHash !== user.password_hash) {
      console.warn('Supabase password mismatch – using demo login fallback.');
      return issueDemoAuthResult(params.email);
    }

    const token = issueAuthToken(user.id);
    return { success: true, userId: user.id, token };
  } catch (error: any) {
    console.error('Unexpected signIn error:', error);
    return issueDemoAuthResult(params.email);
  }
}

/**
 * n8n Webhook Integration for Care Circle notifications
 */
export async function triggerN8NWorkflow(
  event: string,
  payload: any
): Promise<boolean> {
  if (!config.keys.n8nWebhook) {
    throw new Error('N8N webhook URL not configured – cannot trigger workflow.');
  }
  
  try {
    const response = await fetch(config.keys.n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
    });
    
    if (!response.ok) {
      throw new Error(`N8N webhook returned ${response.status}`);
    }
    
    console.log(`🔔 Triggered n8n webhook for "${event}"`);
    return true;
  } catch (error) {
    console.error('n8n webhook error:', error);
    throw error;
  }
}

/**
 * Get user preferences from Supabase
 */
export async function getUserPreferences(userId: string): Promise<any> {
  if (!supabase) {
    throw new Error('Supabase client not initialized – cannot fetch user preferences.');
  }
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Failed to fetch user preferences from Supabase:', error);
      throw new Error(`Failed to fetch preferences: ${error.message}`);
    }

    return data || {};
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
}

/**
 * Get recent chat history for a user from Supabase
 */
export async function getChatHistory(userId: string, limit: number = 50): Promise<any[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not initialized – returning empty chat history');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      // Handle missing table gracefully (PGRST205 = table not found)
      if (error.code === 'PGRST205') {
        console.warn('⚠️ Table "chat_messages" does not exist in database. Returning empty history.');
        return [];
      }
      console.error('Failed to fetch chat history from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return [];
  }
}

/**
 * Generate AI-powered chat reply using Gemini
 * Supports conversation history for context-aware responses
 */
export async function generateChatReply(
  userInput: string,
  history: { role: 'user' | 'amily'; text: string }[] = [],
  isFirstTurn: boolean = false
): Promise<string> {
  if (!config.keys.gemini) {
    throw new Error('Gemini API key is required for chat generation.');
  }

  const systemInstruction =
    'You are Amily, a gentle, patient companion for elderly users. ' +
    'You speak slowly, in short, simple sentences. ' +
    'You avoid technical language. ' +
    'You respond with warmth, reassurance, and clear, kind suggestions. ' +
    (isFirstTurn
      ? 'This is the first conversation today. Gently check if they have taken their pills, eaten, and had some water, then respond warmly.'
      : '');

  try {
    const preparedHistory = history
      .filter((message) => Boolean(message?.text?.trim()))
      .map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.text }],
      }));

    const useSystemInstruction =
      /gemini-2/i.test(GEMINI_CHAT_MODEL) || GEMINI_CHAT_MODEL.includes('flash');

    const contents: any[] = [...preparedHistory];

    if (!useSystemInstruction) {
      contents.unshift({
        role: 'system',
        parts: [{ text: systemInstruction }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userInput }],
    });

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 220,
        topP: 0.9,
      },
    };

    if (useSystemInstruction) {
      requestBody.systemInstruction = {
        role: 'system',
        parts: [{ text: systemInstruction }],
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CHAT_MODEL}:generateContent`;

    const response = await fetch(`${endpoint}?key=${config.keys.gemini}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const json: any = await response.json();
    const candidateText =
      json.candidates
        ?.map((candidate: any) =>
          candidate.content?.parts
            ?.map((part: any) => part?.text ?? '')
            .join('')
            .trim()
        )
        .find((text: string) => Boolean(text)) ?? '';

    if (!candidateText) {
      throw new Error('Empty response from Gemini');
    }

    return candidateText;
  } catch (error) {
    console.error('AI chat generation error:', error);
    throw error;
  }
}
