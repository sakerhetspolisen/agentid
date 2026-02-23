/**
 * JWT utilities for AgentID certificates.
 *
 * Algorithm  : RS256 (RSA + SHA-256)
 * Expiry     : 5 minutes from issuance
 * Issuer     : "agentid"
 *
 * Privacy model
 * ─────────────
 * The `sub` claim is a pseudonymous identifier derived as:
 *   HMAC-SHA256(JWT_HMAC_SECRET, personalNumber)  →  hex string
 *
 * This means:
 *  • The same BankID user always produces the same `sub` (stable for
 *    rate-limiting / abuse detection by third-party verifiers).
 *  • The actual personal number is never included in the token.
 *  • Without the HMAC secret (which never leaves AgentID), the `sub`
 *    cannot be reversed to reveal the real identity.
 *  • Rotating JWT_HMAC_SECRET resets all pseudonym linkages.
 *
 * No name fields (name / given_name / family_name) are included.
 *
 * Third-party offline verification
 * ─────────────────────────────────
 *  1. Fetch GET /api/jwks  (cache for ≥1 hour)
 *  2. Verify RS256 signature with the matching `kid`
 *  3. Check  exp > now  and  iss === "agentid"
 *
 * Keys
 * ────
 * Run `node scripts/generate-keys.mjs` once to populate .env.local.
 */

import {
  SignJWT,
  importPKCS8,
  importSPKI,
  exportJWK,
  type JWK,
} from 'jose';
import { createHmac } from 'crypto';

const ISSUER = 'agentid';
const EXPIRY = '5m';
const KEY_ID = 'agentid-key-1';

// Cache parsed keys so we don't re-parse on every request
let cachedPrivateKey: CryptoKey | null = null;
let cachedPublicJwk: JWK | null = null;

function readPem(envVar: string): string {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(
      `Environment variable ${envVar} is not set. Run: node scripts/generate-keys.mjs`,
    );
  }
  // Restore real newlines from the \n-escaped format stored in .env
  return raw.replace(/\\n/g, '\n');
}

async function getPrivateKey(): Promise<CryptoKey> {
  if (!cachedPrivateKey) {
    cachedPrivateKey = await importPKCS8(readPem('JWT_PRIVATE_KEY'), 'RS256');
  }
  return cachedPrivateKey;
}

/** Returns the public key as a JWK for inclusion in the JWKS endpoint. */
export async function getPublicJwk(): Promise<JWK> {
  if (!cachedPublicJwk) {
    const key = await importSPKI(readPem('JWT_PUBLIC_KEY'), 'RS256');
    const jwk = await exportJWK(key);
    cachedPublicJwk = {
      ...jwk,
      kty: 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid: KEY_ID,
    };
  }
  return cachedPublicJwk;
}

/**
 * Derives a stable, opaque pseudonymous identifier from a BankID personal
 * number using HMAC-SHA256 keyed by JWT_HMAC_SECRET.
 *
 * The result is a 64-character hex string that is:
 *  - Deterministic: same input → same output
 *  - Non-reversible without the secret
 *  - Safe to include in a JWT visible to third parties
 */
function deriveSubject(personalNumber: string): string {
  const secret = process.env.JWT_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_HMAC_SECRET is not set. Run: node scripts/generate-keys.mjs',
    );
  }
  return createHmac('sha256', secret).update(personalNumber).digest('hex');
}

export interface AgentIdClaims {
  personalNumber: string; // Used only to derive sub — never stored in JWT
}

/**
 * Issues a signed RS256 JWT valid for 1 hour.
 *
 * The token is intended to be sent in the `X-AgentId-Token` HTTP header
 * by the AI agent's MCP integration on every outbound request.
 *
 * The JWT contains NO personally identifiable information.
 */
export async function issueJwt(claims: AgentIdClaims): Promise<string> {
  const privateKey = await getPrivateKey();
  const sub = deriveSubject(claims.personalNumber);

  return new SignJWT({ auth_method: 'bankid' })
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setSubject(sub)
    .setJti(crypto.randomUUID())
    .setExpirationTime(EXPIRY)
    .sign(privateKey);
}
