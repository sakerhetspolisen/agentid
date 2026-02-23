/**
 * GET /api/jwks
 *
 * Returns the AgentID public key set (JWKS) so that third-party services
 * can verify AgentID JWTs **offline** without contacting our service.
 *
 * Verification steps for third parties:
 *   1. Fetch this endpoint once (cache for ≥5 minutes).
 *   2. Find the key with matching `kid` from the JWT header.
 *   3. Verify the RS256 signature.
 *   4. Check `exp` > now  and  `iss` === "agentid".
 *
 * The response is intentionally cached for 5 minutes (matching JWT expiry).
 * Key rotation: increment `kid` in lib/jwt.ts and re-deploy.
 *
 * In production, consider exposing this at /.well-known/jwks.json as well.
 */

import { NextResponse } from 'next/server';
import { getPublicJwk } from '@/lib/jwt';

export async function GET() {
  try {
    const jwk = await getPublicJwk();
    return NextResponse.json(
      { keys: [jwk] },
      {
        headers: {
          // Allow clients to cache the public key for up to 5 minutes
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    console.error('[jwks] Failed to load public key:', err);
    return NextResponse.json(
      { error: 'Failed to load public key.' },
      { status: 500 },
    );
  }
}
