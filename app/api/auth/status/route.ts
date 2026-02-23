/**
 * GET /api/auth/status?sessionId=<sessionId>
 *
 * Called by the MCP integration to check whether the user has completed
 * BankID authentication and retrieve the resulting JWT.
 *
 * Responses:
 *   { status: "pending" }
 *   { status: "complete", jwt: "<signed-JWT>" }
 *   { status: "failed",  hintCode: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/store';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'MISSING_SESSION_ID', message: 'sessionId query param is required.' },
      { status: 400 },
    );
  }

  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: 'SESSION_NOT_FOUND', message: 'Session not found or expired.' },
      { status: 404 },
    );
  }

  if (session.status === 'complete' && session.jwt) {
    return NextResponse.json({ status: 'complete', jwt: session.jwt });
  }

  if (session.status === 'failed') {
    return NextResponse.json({
      status: 'failed',
      hintCode: session.hintCode ?? 'unknown',
    });
  }

  return NextResponse.json({ status: 'pending' });
}
