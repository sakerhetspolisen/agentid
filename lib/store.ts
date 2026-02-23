/**
 * Session store — dual-mode: Redis in production, in-memory in local dev.
 *
 * Set REDIS_URL in your environment to enable Redis (e.g. from Vercel Storage
 * Marketplace). Without it, the module falls back to an in-memory Map, which
 * is fine for a single local dev instance but will NOT work across multiple
 * serverless function invocations.
 *
 * The Redis client is created as a module-level singleton so it is reused
 * across warm serverless invocations. The redis package handles reconnection
 * automatically if the connection drops.
 */

import { createClient, type RedisClientType } from 'redis';

export interface UserAttributes {
  personalNumber: string;
  name: string;
  givenName: string;
  surname: string;
}

export type SessionStatus = 'pending' | 'complete' | 'failed';

export interface Session {
  grandidSessionId: string;
  status: SessionStatus;
  jwt?: string;
  userAttributes?: UserAttributes;
  hintCode?: string;
  createdAt: number;
  completedAt?: number;
}

// ── Runtime detection ─────────────────────────────────────────────────────────

const USE_REDIS = !!process.env.REDIS_URL;

const PENDING_TTL_S = 10 * 60; // 10 minutes
const COMPLETE_TTL_S = 60 * 60; // 1 hour (matches JWT expiry)

// ── Redis singleton ───────────────────────────────────────────────────────────

let _redis: RedisClientType | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (_redis) return _redis;

  _redis = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
  _redis.on('error', (err) => console.error('[redis] client error:', err));
  await _redis.connect();
  return _redis;
}

// ── In-memory fallback (local dev without Redis) ──────────────────────────────

const memStore = new Map<string, Session>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function ttlFor(session: Session): number {
  return session.status === 'complete' ? COMPLETE_TTL_S : PENDING_TTL_S;
}

function key(sessionId: string): string {
  return `agentid:session:${sessionId}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createSession(grandidSessionId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const session: Session = {
    grandidSessionId,
    status: 'pending',
    createdAt: Date.now(),
  };

  if (USE_REDIS) {
    const redis = await getRedis();
    await redis.set(key(sessionId), JSON.stringify(session), {
      EX: PENDING_TTL_S,
    });
  } else {
    memStore.set(sessionId, session);
  }

  return sessionId;
}

export async function getSession(
  sessionId: string,
): Promise<Session | null> {
  if (USE_REDIS) {
    const redis = await getRedis();
    const raw = await redis.get(key(sessionId));
    return raw ? (JSON.parse(raw) as Session) : null;
  }
  return memStore.get(sessionId) ?? null;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Omit<Session, 'grandidSessionId' | 'createdAt'>>,
): Promise<void> {
  if (USE_REDIS) {
    const redis = await getRedis();
    const raw = await redis.get(key(sessionId));
    if (!raw) return;
    const updated: Session = { ...(JSON.parse(raw) as Session), ...updates };
    await redis.set(key(sessionId), JSON.stringify(updated), {
      EX: ttlFor(updated),
    });
  } else {
    const existing = memStore.get(sessionId);
    if (existing) memStore.set(sessionId, { ...existing, ...updates });
  }
}
