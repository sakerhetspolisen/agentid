/**
 * GET /api/auth/[sessionId]/poll
 *
 * Called every ~2 seconds by the browser-based auth page to:
 *  - Retrieve the latest QR code from GrandID
 *  - Report the current auth status
 *
 * When authentication completes, this endpoint:
 *  1. Issues a signed RS256 JWT from BankID user attributes
 *  2. Persists the JWT in the session store (so /api/auth/status can return it)
 *  3. Returns { status: "complete" } to the browser
 *
 * Per the GrandID docs, polling MUST NOT happen more often than every 2 seconds.
 * The QR code SHOULD be updated after each poll when using QR codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession as getStoredSession, updateSession } from '@/lib/store';
import {
  getSession as getGrandidSession,
  isComplete,
  isPending,
  isFailed,
  isNotLoggedIn,
} from '@/lib/grandid';
import { issueJwt } from '@/lib/jwt';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const session = await getStoredSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'SESSION_NOT_FOUND' },
      { status: 404 },
    );
  }

  // Short-circuit if we already have a terminal state
  if (session.status === 'complete') {
    return NextResponse.json({ status: 'complete' });
  }
  if (session.status === 'failed') {
    return NextResponse.json({ status: 'failed', hintCode: session.hintCode });
  }

  // Poll GrandID
  let grandidResponse;
  try {
    grandidResponse = await getGrandidSession(session.grandidSessionId);
  } catch (err) {
    console.error('[poll] GrandID fetch failed:', err);
    return NextResponse.json({ error: 'GRANDID_UNREACHABLE' }, { status: 502 });
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (isComplete(grandidResponse)) {
    const { personalNumber, name, givenName, surname } =
      grandidResponse.userAttributes;
    try {
      // Only personalNumber is passed to issueJwt — the JWT itself contains
      // no PII. Name fields are stored server-side for internal/audit use only.
      const jwt = await issueJwt({ personalNumber });
      await updateSession(sessionId, {
        status: 'complete',
        jwt,
        userAttributes: { personalNumber, name, givenName, surname },
        completedAt: Date.now(),
      });
      return NextResponse.json({ status: 'complete' });
    } catch (err) {
      console.error('[poll] JWT issuance failed:', err);
      await updateSession(sessionId, { status: 'failed', hintCode: 'JWT_ERROR' });
      return NextResponse.json(
        { status: 'failed', hintCode: 'JWT_ERROR' },
        { status: 500 },
      );
    }
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (isFailed(grandidResponse)) {
    const hintCode = grandidResponse.grandidObject.message.hintCode;
    await updateSession(sessionId, { status: 'failed', hintCode });
    return NextResponse.json({ status: 'failed', hintCode });
  }

  // ── Pending (return refreshed QR code) ────────────────────────────────────
  if (isPending(grandidResponse)) {
    return NextResponse.json({
      status: 'pending',
      hintCode: grandidResponse.grandidObject.message.hintCode,
      qrCode: grandidResponse.grandidObject.QRCode ?? null,
    });
  }

  // NOTLOGGEDIN = session hasn't started yet — still waiting for the user to
  // open the auth page and scan the QR code.
  if (isNotLoggedIn(grandidResponse)) {
    return NextResponse.json({ status: 'pending', hintCode: 'outstandingTransaction' });
  }

  // Unexpected response shape — treat as still pending
  return NextResponse.json({ status: 'pending' });
}
