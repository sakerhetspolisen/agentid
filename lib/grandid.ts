/**
 * GrandID/E-identitet BankID API client.
 * Uses the test environment: https://client.test.grandid.com
 * Docs: https://docs.grandid.com/bankid/
 */

const BASE_URL =
  process.env.GRANDID_BASE_URL ?? 'https://client.test.grandid.com';
const API_KEY = process.env.GRANDID_API_KEY ?? '';
const SERVICE_KEY = process.env.GRANDID_SERVICE_KEY ?? '';

// ── Response types ────────────────────────────────────────────────────────────

export interface GrandIDError {
  errorObject: { code: string; message: string };
}

/** Returned by FederatedLogin when gui=false */
export interface FederatedLoginResponse {
  sessionId?: string;
  QRCode?: string;
  autoStartToken?: string;
  redirectUrl?: string; // present when gui=true
  errorObject?: { code: string; message: string };
}

export interface GetSessionPending {
  grandidObject: {
    code: 'BANKID_MSG';
    message: {
      status: 'pending';
      hintCode:
        | 'outstandingTransaction'
        | 'userSign'
        | 'started'
        | string;
    };
    sessionId: string;
    QRCode?: string;
    autoStartToken?: string;
  };
}

export interface GetSessionFailed {
  grandidObject: {
    code: 'BANKID_MSG';
    message: { status: 'failed'; hintCode: string };
    sessionId: string;
    QRCode?: string;
    autoStartToken?: string;
  };
}

export interface GetSessionComplete {
  sessionId: string;
  username: string;
  userAttributes: {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
    ipAddress: string;
    notBefore: string;
    notAfter: string;
    signature: string;
    ocspResponse: string;
    uhi: string;
    bankIdIssueDate: string;
  };
}

export interface GetSessionNotLoggedIn {
  errorObject: { code: 'NOTLOGGEDIN'; message: string };
}

export type GetSessionResponse =
  | GetSessionPending
  | GetSessionFailed
  | GetSessionComplete
  | GetSessionNotLoggedIn
  | GrandIDError;

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseForm(): FormData {
  const form = new FormData();
  form.append('apiKey', API_KEY);
  form.append('authenticateServiceKey', SERVICE_KEY);
  return form;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Initiates a BankID authentication session using a custom UI (gui=false)
 * with QR code support. The caller is responsible for polling GetSession.
 */
export async function federatedLogin(
  callbackUrl?: string,
): Promise<FederatedLoginResponse> {
  const form = baseForm();
  form.append('gui', 'false');
  form.append('qr', 'true');
  form.append('mobileBankId', 'true');
  form.append('allowFingerprintAuth', 'true');

  // Message shown inside the BankID app during authentication
  const authMessage = Buffer.from(
    'AgentId verifierar din identitet för AI-agent åtkomst.',
  ).toString('base64');
  form.append('authMessage', authMessage);

  if (callbackUrl) form.append('callbackUrl', callbackUrl);

  const res = await fetch(`${BASE_URL}/json1.1/FederatedLogin`, {
    method: 'POST',
    body: form,
  });

  return res.json() as Promise<FederatedLoginResponse>;
}

/**
 * Polls the session status. Must be called at most every 2 seconds.
 * Returns a union type — check `grandidObject`, `userAttributes`, or `errorObject`.
 */
export async function getSession(
  grandidSessionId: string,
): Promise<GetSessionResponse> {
  const form = baseForm();
  form.append('sessionId', grandidSessionId);

  const res = await fetch(`${BASE_URL}/json1.1/GetSession`, {
    method: 'POST',
    body: form,
  });

  return res.json() as Promise<GetSessionResponse>;
}

/**
 * Cancels any ongoing BankID transaction for the given session.
 */
export async function logout(grandidSessionId: string): Promise<void> {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    authenticateServiceKey: SERVICE_KEY,
    sessionId: grandidSessionId,
    cancelBankID: 'true',
  });

  await fetch(`${BASE_URL}/json1.1/Logout?${params}`, { method: 'GET' });
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isComplete(r: GetSessionResponse): r is GetSessionComplete {
  return 'userAttributes' in r && r.userAttributes !== undefined;
}

export function isPending(r: GetSessionResponse): r is GetSessionPending {
  return (
    'grandidObject' in r && r.grandidObject.message.status === 'pending'
  );
}

export function isFailed(r: GetSessionResponse): r is GetSessionFailed {
  return (
    'grandidObject' in r && r.grandidObject.message.status === 'failed'
  );
}

export function isNotLoggedIn(
  r: GetSessionResponse,
): r is GetSessionNotLoggedIn {
  return (
    'errorObject' in r &&
    (r as GetSessionNotLoggedIn).errorObject?.code === 'NOTLOGGEDIN'
  );
}
