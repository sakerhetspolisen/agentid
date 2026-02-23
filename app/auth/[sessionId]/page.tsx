'use client';

/**
 * /auth/[sessionId]
 *
 * The BankID authentication page shown to the user.
 * The MCP integration returns the URL to this page after calling /api/auth/start.
 *
 * Flow:
 *  1. Page loads → starts polling /api/auth/[sessionId]/poll every 2 s
 *  2. Poll response includes a base64-encoded QR code PNG → rendered as <img>
 *  3. User opens BankID on their phone and scans the QR code
 *  4. BankID completes → poll returns { status: "complete" } → show success
 *  5. User can close this tab; the MCP's own status poll now returns the JWT
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScreenStatus = 'loading' | 'pending' | 'complete' | 'failed' | 'not_found';

interface PollResponse {
  status: 'pending' | 'complete' | 'failed';
  hintCode?: string;
  qrCode?: string;
  error?: string;
}

// ── User-facing hint messages ─────────────────────────────────────────────────

const HINT: Record<string, string> = {
  outstandingTransaction: 'Open BankID on your phone and scan the QR code below.',
  started: 'BankID is starting…',
  userSign: 'Enter your PIN or use biometrics in BankID.',
  startFailed: 'BankID did not start in time. Please try again.',
  userCancel: 'You cancelled the BankID authentication.',
  expiredTransaction: 'The session has expired. Please try again.',
  certificateErr: 'Certificate error in BankID. Please contact support.',
  JWT_ERROR: 'An internal error occurred while issuing your certificate.',
};

function hintMessage(code?: string): string {
  if (!code) return 'Follow the instructions in your BankID app.';
  return HINT[code] ?? 'Follow the instructions in your BankID app.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [screen, setScreen] = useState<ScreenStatus>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [hintCode, setHintCode] = useState<string>('outstandingTransaction');

  // Keep a ref so the interval callback always sees the latest screen state
  const screenRef = useRef<ScreenStatus>('loading');
  screenRef.current = screen;

  const poll = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/auth/${sessionId}/poll`);

      if (res.status === 404) {
        setScreen('not_found');
        return false;
      }

      const data: PollResponse = await res.json();

      if (data.status === 'complete') {
        setScreen('complete');
        return false;
      }

      if (data.status === 'failed') {
        setHintCode(data.hintCode ?? 'unknown');
        setScreen('failed');
        return false;
      }

      // Still pending — update QR and hint
      setScreen('pending');
      if (data.qrCode) setQrCode(data.qrCode);
      if (data.hintCode) setHintCode(data.hintCode);
      return true;
    } catch {
      // Network hiccup — keep trying
      return true;
    }
  }, [sessionId]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const start = async () => {
      const keepGoing = await poll();
      if (!keepGoing || cancelled) return;

      // Poll every 2 seconds as required by GrandID docs
      intervalId = setInterval(async () => {
        const keepGoing = await poll();
        if (!keepGoing && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 2000);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [poll]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* ── Brand header ── */}
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight text-white">
          AgentID
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Verify your identity for AI agent access
        </p>
      </div>

      {/* ── Auth card ── */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        {/* Loading */}
        {screen === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Spinner />
            <p className="text-sm text-gray-400">Initialising BankID…</p>
          </div>
        )}

        {/* QR / Pending */}
        {screen === "pending" && (
          <div className="flex flex-col items-center gap-6">
            <div>
              <p className="text-center text-sm font-medium text-white">
                Scan with BankID
              </p>
              <p className="mt-1 text-center text-xs text-gray-400">
                {hintMessage(hintCode)}
              </p>
            </div>

            {qrCode ? (
              <div className="rounded-xl bg-white p-3 shadow-inner">
                {/* QRCode is a base64-encoded PNG from GrandID */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/svg+xml;base64,${qrCode}`}
                  alt="BankID QR code"
                  width={192}
                  height={192}
                  className="block"
                />
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-800">
                <Spinner />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              Waiting for BankID…
            </div>
          </div>
        )}

        {/* Success */}
        {screen === "complete" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
              <CheckIcon className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Identity Verified
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Your AI agent has been issued a 1-hour AgentID certificate.
                You can safely close this tab.
              </p>
            </div>
          </div>
        )}

        {/* Failed */}
        {screen === "failed" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <XIcon className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Authentication Failed
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {hintMessage(hintCode)}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Not found */}
        {screen === "not_found" && (
          <p className="py-6 text-center text-sm text-gray-500">
            Session not found or expired. Please restart the authentication from
            your AI agent.
          </p>
        )}
      </div>

      {/* ── Footer ── */}
      <p className="mt-8 text-xs text-gray-700">
        Powered by BankID · AgentID
      </p>
    </div>
  );
}

// ── Inline icon components (no extra dependencies) ────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
