/**
 * POST /api/auth/start
 *
 * Called by the MCP integration to begin a BankID authentication flow.
 *
 * Response:
 *   { sessionId: string, authUrl: string, expiresAt: number }
 *
 * The MCP should:
 *   1. Open `authUrl` in the user's browser (or display it to the user).
 *   2. Poll GET /api/auth/status?sessionId=<sessionId> until status === "complete".
 *   3. Extract `jwt` from the status response and attach it as the
 *      `X-AgentID-Token` header on all subsequent outbound requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { federatedLogin } from '@/lib/grandid';
import { createSession } from '@/lib/store';

export async function POST(request: NextRequest) {
  // Guard: reject if GrandID credentials are not configured
  if (!process.env.GRANDID_API_KEY || !process.env.GRANDID_SERVICE_KEY) {
    return NextResponse.json(
      {
        error: 'SERVICE_MISCONFIGURED',
        message:
          'GrandID credentials are not set. Configure GRANDID_API_KEY and GRANDID_SERVICE_KEY in .env.local.',
      },
      { status: 503 },
    );
  }

  try {
    const grandid = await federatedLogin();

    if (grandid.errorObject || !grandid.sessionId) {
      console.error('[auth/start] GrandID error:', grandid.errorObject);
      return NextResponse.json(
        {
          error: grandid.errorObject?.code ?? 'GRANDID_ERROR',
          message:
            grandid.errorObject?.message ??
            'Failed to initialise BankID session.',
        },
        { status: 502 },
      );
    }

    const sessionId = await createSession(grandid.sessionId);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      `https://${request.headers.get('host')}`;

    const authUrl = `${appUrl}/auth/${sessionId}`;
    // Sessions (and the pending QR) expire in ~5 minutes if unused
    const expiresAt = Date.now() + 5 * 60 * 1000;

    return NextResponse.json({ sessionId, authUrl, expiresAt });
  } catch (err) {
    console.error('[auth/start] Unexpected error:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to start authentication.' },
      { status: 500 },
    );
  }
}
