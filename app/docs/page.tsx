/**
 * /docs — AgentID developer documentation.
 * Intended for internal coworkers building the MCP integration and the
 * third-party verifier package.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentID Docs",
  description: "Developer documentation for the AgentID ecosystem",
};

// ── Tiny layout helpers ───────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="mb-6 text-xl font-semibold text-white border-b border-gray-800 pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-8 scroll-mt-24">
      <h3 className="mb-3 text-base font-semibold text-gray-200">{title}</h3>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl bg-gray-950 p-5 text-xs leading-relaxed text-gray-300 border border-gray-800">
      <code>{children}</code>
    </pre>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-7 text-gray-400">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-blue-800/50 bg-blue-950/30 px-4 py-3 text-sm text-blue-300">
      {children}
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-yellow-800/50 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-300">
      {children}
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300">
      {children}
    </code>
  );
}

// ── TOC entries ───────────────────────────────────────────────────────────────

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "api-reference", label: "API Reference" },
  { id: "mcp-integration", label: "Building the MCP Integration" },
  { id: "verifier", label: "Building the Verifier Package" },
  { id: "deployment", label: "Deploying to Vercel" },
  { id: "env-vars", label: "Environment Variables" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-blue-400 mb-2">
            Internal Developer Documentation
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            AgentID
          </h1>
          <p className="text-gray-400 max-w-xl">
            Identity verification for AI agents, powered by BankID. This doc
            covers the full ecosystem — the central service (already built), the
            MCP integration, and the third-party verifier package.
          </p>
        </div>

        <div className="flex gap-12">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-600">
                On this page
              </p>
              <nav className="space-y-1.5">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* ── Overview ─────────────────────────────────────────────── */}
            <Section id="overview" title="Overview">
              <P>
                AgentID lets AI agents carry a cryptographically signed
                certificate proving their operator has authenticated via BankID.
                Third-party services can verify the certificate{" "}
                <strong className="text-white">offline</strong> — no round-trip
                to AgentID required.
              </P>
              <P>The ecosystem consists of three components:</P>
              <div className="my-4 space-y-3">
                {[
                  {
                    tag: "✓ Built",
                    color: "green",
                    title: "AgentID Service",
                    desc: "This Next.js app. Handles BankID authentication via GrandID and issues signed JWTs.",
                  },
                  {
                    tag: "→ Your next task",
                    color: "blue",
                    title: "MCP Integration",
                    desc: "An MCP server the user installs in their AI agent (Claude Desktop, etc.). Requests certificates and injects them into HTTP headers.",
                  },
                  {
                    tag: "→ Your next task",
                    color: "blue",
                    title: "Verifier Package",
                    desc: "An npm package (or library) that organisations install to verify AgentID JWTs without calling our service.",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="flex gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4"
                  >
                    <span
                      className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                        c.color === "green"
                          ? "bg-green-900/50 text-green-400"
                          : "bg-blue-900/50 text-blue-400"
                      }`}
                    >
                      {c.tag}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {c.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Architecture ──────────────────────────────────────────── */}
            <Section id="architecture" title="Architecture">
              <P>End-to-end flow from blocked AI agent to verified request:</P>
              <Code>{`
AI Agent (e.g. Claude)
  │
  │  1. Agent hits a site that requires AgentID
  │
  ▼
MCP Integration  ──────── POST /api/auth/start ──────────►  AgentID Service
  │                                                              │
  │  2. Shows authUrl to user                                    │  3. Calls GrandID
  │     (opens browser / prints URL)                            ▼
  │                                                         GrandID BankID API
  │                                                              │
  ▼                                                              │  4. Shows QR
Browser  ◄─────────────── /auth/{sessionId} ────────────────────┘
  │
  │  5. User scans QR with BankID app, approves
  │
  ▼
AgentID Service  (poll detects completion)
  │
  │  6. Issues RS256 JWT  →  stores in session (Vercel KV)
  │
MCP Integration  ──────── GET /api/auth/status ──────────►  returns { jwt }
  │
  │  7. Caches JWT, sets X-AgentID-Token header on all requests
  │
  ▼
Third-party Service
  │
  │  8. Verifies JWT offline:
  │     - Fetches JWKS from GET /api/jwks  (cached ≥1 h)
  │     - Checks RS256 signature + exp + iss
  │
  ▼
  Allows / blocks request
`}</Code>
              <P>
                The JWT contains no PII. The <InlineCode>sub</InlineCode> claim
                is{" "}
                <InlineCode>
                  HMAC-SHA256(server_secret, personalNumber)
                </InlineCode>{" "}
                — a stable pseudonymous ID that third parties can use for
                rate-limiting without ever learning who the user is.
              </P>
            </Section>

            {/* ── API Reference ─────────────────────────────────────────── */}
            <Section id="api-reference" title="API Reference">
              {[
                {
                  method: "POST",
                  path: "/api/auth/start",
                  caller: "MCP integration",
                  desc: "Initiates a BankID session. Returns a sessionId and the URL to show the user.",
                  request: `// No body required
curl -X POST https://agentidapp.vercel.app/api/auth/start`,
                  response: `{
  "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "authUrl":   "https://agentidapp.vercel.app/auth/xxxxxxxx-...",
  "expiresAt": 1700000300000
}`,
                },
                {
                  method: "GET",
                  path: "/api/auth/status?sessionId=<id>",
                  caller: "MCP integration",
                  desc: "Polls for completion. Returns the signed JWT once the user has authenticated.",
                  request: `curl "https://agentidapp.vercel.app/api/auth/status?sessionId=xxxx"`,
                  response: `// Pending:
{ "status": "pending" }

// Complete:
{ "status": "complete", "jwt": "eyJhbGci..." }

// Failed:
{ "status": "failed", "hintCode": "userCancel" }`,
                },
                {
                  method: "GET",
                  path: "/api/jwks",
                  caller: "Third-party verifiers",
                  desc: "Public JWK set for offline RS256 JWT verification. Cache for ≥1 hour.",
                  request: `curl https://agentidapp.vercel.app/api/jwks`,
                  response: `{
  "keys": [{
    "kty": "RSA",
    "use": "sig",
    "alg": "RS256",
    "kid": "agentid-key-1",
    "n":   "...",
    "e":   "AQAB"
  }]
}`,
                },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        ep.method === "POST"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="text-sm text-gray-200">{ep.path}</code>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Caller: {ep.caller}
                  </p>
                  <p className="text-sm text-gray-400 mb-3">{ep.desc}</p>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Request
                  </p>
                  <Code>{ep.request}</Code>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Response
                  </p>
                  <Code>{ep.response}</Code>
                </div>
              ))}
            </Section>

            {/* ── MCP Integration ───────────────────────────────────────── */}
            <Section id="mcp-integration" title="Building the MCP Integration">
              <P>
                The MCP (Model Context Protocol) integration is what end users
                install inside their AI agent setup. It runs as an MCP server
                that the AI agent connects to. When the agent needs an AgentID
                certificate, it calls the tool provided by this server.
              </P>

              <Sub id="mcp-overview" title="What it needs to do">
                <div className="space-y-2 text-sm text-gray-400">
                  {[
                    "Expose a tool (e.g. get_agentid_token) the AI can call",
                    "Call POST /api/auth/start to get a sessionId and authUrl",
                    "Show the authUrl to the user (print to terminal or open browser)",
                    "Poll GET /api/auth/status every 2–3 s until status === 'complete'",
                    "Cache the JWT with its expiry time",
                    "Return the JWT to the AI agent, which then adds it to outbound requests",
                    "Re-request automatically when the JWT expires (1 hour TTL)",
                  ].map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex-shrink-0 text-blue-500">
                        {i + 1}.
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </Sub>

              <Sub id="mcp-setup" title="Project setup">
                <Code>{`mkdir agentid-mcp && cd agentid-mcp
npm init -y
npm install @modelcontextprotocol/sdk node-fetch
npm install -D typescript @types/node tsx

# tsconfig.json — set "module": "node16", "target": "es2022"`}</Code>
              </Sub>

              <Sub id="mcp-server" title="Full server implementation">
                <Code>{`// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const AGENTID_URL =
  process.env.AGENTID_URL ?? "https://agentidapp.vercel.app";

// ── JWT cache ────────────────────────────────────────────────────────────────

let cachedJwt: string | null = null;
let jwtExpiresAt = 0; // Unix ms

function getStoredJwt(): string | null {
  if (cachedJwt && Date.now() < jwtExpiresAt - 60_000) {
    return cachedJwt; // still valid (with 60 s buffer)
  }
  cachedJwt = null;
  return null;
}

// ── AgentID API helpers ────────────────────────────────────────────────────

async function startAuth(): Promise<{ sessionId: string; authUrl: string }> {
  const res = await fetch(\`\${AGENTID_URL}/api/auth/start\`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(\`AgentID /start failed: \${res.status}\`);
  return res.json();
}

async function pollStatus(sessionId: string): Promise<string> {
  // Poll until complete (or failed). Blocks until resolved.
  while (true) {
    const res = await fetch(
      \`\${AGENTID_URL}/api/auth/status?sessionId=\${sessionId}\`
    );
    const data = await res.json();

    if (data.status === "complete") return data.jwt as string;
    if (data.status === "failed")
      throw new Error(\`BankID auth failed: \${data.hintCode}\`);

    await new Promise((r) => setTimeout(r, 2500));
  }
}

// ── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "agentid-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_agentid_token",
      description:
        "Requests an AgentID identity certificate via BankID. " +
        "Returns a signed JWT to include in the X-AgentID-Token header. " +
        "Call this when a website requires AgentID verification.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "get_agentid_token") {
    throw new Error("Unknown tool");
  }

  // Return cached token if still valid
  const stored = getStoredJwt();
  if (stored) {
    return {
      content: [{ type: "text", text: stored }],
    };
  }

  // Initiate new auth
  const { sessionId, authUrl } = await startAuth();

  // Tell the AI agent to show the URL to the user
  console.error(
    \`\\n[AgentID] Open this URL in your browser to authenticate:\\n\${authUrl}\\n\`
  );

  // Poll for completion
  const jwt = await pollStatus(sessionId);

  // Cache: parse expiry from JWT payload (middle segment, base64)
  const payload = JSON.parse(
    Buffer.from(jwt.split(".")[1], "base64url").toString()
  );
  cachedJwt = jwt;
  jwtExpiresAt = payload.exp * 1000;

  return {
    content: [{ type: "text", text: jwt }],
  };
});

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);`}</Code>
              </Sub>

              <Sub id="mcp-claude-desktop" title="Connecting to Claude Desktop">
                <P>
                  Add to{" "}
                  <InlineCode>
                    ~/Library/Application
                    Support/Claude/claude_desktop_config.json
                  </InlineCode>
                  :
                </P>
                <Code>{`{
  "mcpServers": {
    "agentid": {
      "command": "node",
      "args": ["/path/to/agentid-mcp/dist/index.js"],
      "env": {
        "AGENTID_URL": "https://agentidapp.vercel.app"
      }
    }
  }
}`}</Code>
              </Sub>

              <Sub
                id="mcp-header-injection"
                title="How the AI injects the header"
              >
                <P>
                  Once the AI agent has the JWT from{" "}
                  <InlineCode>get_agentid_token</InlineCode>, it should include
                  it in all outbound HTTP requests as:
                </P>
                <Code>{`X-AgentID-Token: eyJhbGciOiJSUzI1NiIsImtpZCI6ImFnZW50cGFzcy1rZXktMSJ9...`}</Code>
                <P>
                  Exactly how to inject this depends on the agent framework. For
                  custom HTTP calls, add it to the request headers object. For
                  browser automation (Playwright/Puppeteer), inject it via{" "}
                  <InlineCode>page.setExtraHTTPHeaders()</InlineCode>.
                </P>
              </Sub>

              <Note>
                The MCP tool blocks until the user completes BankID
                authentication. Make sure your MCP client has a generous timeout
                (e.g. 5 minutes) for this tool call.
              </Note>
            </Section>

            {/* ── Verifier Package ──────────────────────────────────────── */}
            <Section id="verifier" title="Building the Verifier Package">
              <P>
                The verifier is a small library that organisations install to
                check AgentID JWTs. Verification is fully offline — the library
                fetches the public key once, caches it, and verifies all
                subsequent tokens locally using standard RS256.
              </P>

              <Sub id="verifier-what" title="What to verify">
                <div className="space-y-2 text-sm text-gray-400">
                  {[
                    {
                      field: "Signature",
                      detail: "RS256 using the public key from GET /api/jwks",
                    },
                    { field: "iss", detail: 'Must equal "agentid"' },
                    {
                      field: "exp",
                      detail: "Must be in the future (1-hour tokens)",
                    },
                    {
                      field: "alg (header)",
                      detail: 'Must be "RS256" — reject if "none" or HS256',
                    },
                  ].map((r) => (
                    <div key={r.field} className="flex gap-3">
                      <InlineCode>{r.field}</InlineCode>
                      <span>{r.detail}</span>
                    </div>
                  ))}
                </div>
              </Sub>

              <Sub id="verifier-core" title="Core implementation (TypeScript)">
                <Code>{`// src/verify.ts
import { createRemoteJWKSet, jwtVerify } from "jose";

const AGENTID_JWKS_URL = "https://agentidapp.vercel.app/api/jwks";
const ISSUER = "agentid";

// Cache the JWKS — jose handles this automatically via createRemoteJWKSet
const JWKS = createRemoteJWKSet(new URL(AGENTID_JWKS_URL), {
  cacheMaxAge: 60 * 60 * 1000, // 1 hour
});

export interface AgentIDPayload {
  sub: string;           // pseudonymous user ID (HMAC of personal number)
  auth_method: string;   // "bankid"
  iat: number;
  exp: number;
  jti: string;
}

/**
 * Verifies an AgentID JWT and returns its payload.
 * Throws if the token is invalid, expired, or from a different issuer.
 */
export async function verifyAgentID(
  token: string
): Promise<AgentIDPayload> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    algorithms: ["RS256"],
  });

  return payload as unknown as AgentIDPayload;
}

/**
 * Returns true if the request carries a valid AgentID token.
 * Does NOT throw — use this for soft checks.
 */
export async function isVerified(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await verifyAgentID(token);
    return true;
  } catch {
    return false;
  }
}`}</Code>
              </Sub>

              <Sub id="verifier-express" title="Express / Node.js middleware">
                <Code>{`// middleware/agentid.ts
import { Request, Response, NextFunction } from "express";
import { verifyAgentID } from "./verify";

/**
 * Blocks requests that lack a valid AgentID token.
 * For a soft check (log but allow), set \`required: false\`.
 */
export function agentIdMiddleware(options = { required: true }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["x-agentid-token"] as string | undefined;

    if (!token) {
      if (options.required) {
        return res.status(401).json({
          error: "MISSING_AGENTID_TOKEN",
          authUrl: "https://agentidapp.vercel.app",
        });
      }
      return next();
    }

    try {
      const payload = await verifyAgentID(token);
      // Attach to request so downstream handlers can use the pseudonymous ID
      (req as any).agentId = payload;
      next();
    } catch (err) {
      if (options.required) {
        return res.status(401).json({ error: "INVALID_AGENTID_TOKEN" });
      }
      next();
    }
  };
}

// Usage:
// app.use("/api/sensitive", agentIdMiddleware());`}</Code>
              </Sub>

              <Sub id="verifier-nextjs" title="Next.js middleware">
                <Code>{`// middleware.ts  (project root)
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://agentidapp.vercel.app/api/jwks"),
  { cacheMaxAge: 3_600_000 }
);

export async function middleware(request: NextRequest) {
  // Only protect routes under /api/protected
  if (!request.nextUrl.pathname.startsWith("/api/protected")) {
    return NextResponse.next();
  }

  const token = request.headers.get("x-agentid-token");
  if (!token) {
    return NextResponse.json(
      { error: "MISSING_AGENTID_TOKEN" },
      { status: 401 }
    );
  }

  try {
    await jwtVerify(token, JWKS, {
      issuer: "agentid",
      algorithms: ["RS256"],
    });
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { error: "INVALID_AGENTID_TOKEN" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/protected/:path*"],
};`}</Code>
              </Sub>

              <Sub id="verifier-deps" title="Dependencies">
                <Code>{`npm install jose
# jose is the same library used by AgentID itself.
# It handles JWKS fetching, caching, and JWT verification.`}</Code>
              </Sub>

              <Note>
                The <InlineCode>sub</InlineCode> claim is a stable pseudonymous
                ID. You can use it for per-user rate limiting without learning
                the user&apos;s real identity. Two requests from the same BankID
                user will always have the same <InlineCode>sub</InlineCode>{" "}
                value.
              </Note>
            </Section>

            {/* ── Deployment ───────────────────────────────────────────── */}
            <Section id="deployment" title="Deploying to Vercel">
              <P>
                The app is production-ready for Vercel.{" "}
                <strong className="text-white">
                  One setup step is required before deploying:
                </strong>{" "}
                creating a Vercel KV database for session storage (the in-memory
                fallback only works for a single local process).
              </P>

              <Sub id="deploy-steps" title="Step-by-step">
                <div className="space-y-4">
                  {[
                    {
                      n: 1,
                      title: "Push to GitHub",
                      code: `git add -A
git commit -m "AgentID initial implementation"
git push origin main`,
                    },
                    {
                      n: 2,
                      title: "Install the Vercel CLI",
                      code: `npm install -g vercel
vercel login`,
                    },
                    {
                      n: 3,
                      title: "Link the project to Vercel",
                      code: `vercel link`,
                    },
                    {
                      n: 4,
                      title: "Add REDIS_URL from Vercel Storage Marketplace",
                      code: `# In the Vercel dashboard:
#   Storage → Connect Store → Redis (Upstash)
#   Create a database → copy the REDIS_URL connection string
#   Settings → Environment Variables → add REDIS_URL

# Then pull all env vars locally:
vercel env pull .env.local`,
                    },
                    {
                      n: 5,
                      title: "Set remaining environment variables",
                      code: `vercel env add GRANDID_API_KEY
vercel env add GRANDID_SERVICE_KEY
vercel env add JWT_PRIVATE_KEY
vercel env add JWT_PUBLIC_KEY
vercel env add JWT_HMAC_SECRET
vercel env add NEXT_PUBLIC_APP_URL   # e.g. https://agentidapp.vercel.app`,
                    },
                    {
                      n: 6,
                      title: "Deploy",
                      code: `vercel --prod`,
                    },
                  ].map((step) => (
                    <div key={step.n}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {step.n}
                        </span>
                        <span className="text-sm font-medium text-gray-200">
                          {step.title}
                        </span>
                      </div>
                      <Code>{step.code}</Code>
                    </div>
                  ))}
                </div>
              </Sub>

              <Sub id="deploy-custom-domain" title="Custom domain">
                <P>
                  After deploying, add a custom domain in the Vercel dashboard
                  (e.g. <InlineCode>agentidapp.vercel.app</InlineCode>), then
                  update:
                </P>
                <Code>{`# Update in Vercel dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://agentidapp.vercel.app`}</Code>
                <P>
                  Also update the <InlineCode>callbackUrl</InlineCode> whitelist
                  in your GrandID service configuration to include your
                  production domain.
                </P>
              </Sub>

              <Warn>
                The JWT private key contains real newlines escaped as{" "}
                <InlineCode>\n</InlineCode> in{" "}
                <InlineCode>.env.local</InlineCode>. When setting it via{" "}
                <InlineCode>vercel env add</InlineCode>, paste the raw PEM (with
                actual newlines) — Vercel stores it correctly. If the deployment
                throws a JWT key parse error, the PEM format is likely the
                issue.
              </Warn>

              <Sub
                id="deploy-grandid-prod"
                title="Switching to production GrandID"
              >
                <P>
                  The current config uses GrandID&apos;s test environment (
                  <InlineCode>client.test.grandid.com</InlineCode>). For
                  production:
                </P>
                <Code>{`# In Vercel dashboard, update:
GRANDID_BASE_URL=https://client.grandid.com
GRANDID_API_KEY=<your production API key>
GRANDID_SERVICE_KEY=<your production service key>`}</Code>
              </Sub>
            </Section>

            {/* ── Environment Variables ─────────────────────────────────── */}
            <Section id="env-vars" title="Environment Variables">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Variable
                      </th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Required
                      </th>
                      <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {[
                      {
                        key: "GRANDID_API_KEY",
                        req: "Yes",
                        desc: "API key from GrandID/E-identitet",
                      },
                      {
                        key: "GRANDID_SERVICE_KEY",
                        req: "Yes",
                        desc: "Service key from GrandID/E-identitet",
                      },
                      {
                        key: "GRANDID_BASE_URL",
                        req: "No",
                        desc: "GrandID base URL. Defaults to test environment.",
                      },
                      {
                        key: "JWT_PRIVATE_KEY",
                        req: "Yes",
                        desc: "RSA-2048 private key (PKCS8 PEM). Generated by scripts/generate-keys.mjs",
                      },
                      {
                        key: "JWT_PUBLIC_KEY",
                        req: "Yes",
                        desc: "RSA-2048 public key (SPKI PEM). Served at /api/jwks.",
                      },
                      {
                        key: "JWT_HMAC_SECRET",
                        req: "Yes",
                        desc: "32-byte hex secret for pseudonymous sub derivation. Rotate to reset identity linkages.",
                      },
                      {
                        key: "NEXT_PUBLIC_APP_URL",
                        req: "Yes",
                        desc: "Public base URL of this service (e.g. https://agentidapp.vercel.app). Used to construct authUrl.",
                      },
                      {
                        key: "REDIS_URL",
                        req: "Prod only",
                        desc: "Redis connection string from Vercel Storage Marketplace (or any Redis provider). Enables persistent session storage across serverless invocations.",
                      },
                    ].map((row) => (
                      <tr key={row.key}>
                        <td className="py-2.5 pr-4 font-mono text-xs text-gray-300 align-top">
                          {row.key}
                        </td>
                        <td className="py-2.5 pr-4 align-top">
                          <span
                            className={`text-xs ${
                              row.req === "Yes"
                                ? "text-red-400"
                                : row.req === "Prod only"
                                  ? "text-yellow-400"
                                  : "text-gray-600"
                            }`}
                          >
                            {row.req}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-gray-500 align-top">
                          {row.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}
