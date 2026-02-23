'use client';

import { useState } from 'react';

type Tab = 'agent' | 'platform';
type AgentClient = 'claudecode' | 'claudedesktop';

// ── Code snippets ──────────────────────────────────────────────────────────────

const CLAUDE_CODE_CMD = 'claude mcp add agentID -- npx -y @agent-id/mcp';

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "agentID": {
      "command": "npx",
      "args": ["-y", "@agent-id/mcp"]
    }
  }
}`;

const NEXTJS_INSTALL = 'npm install @agent-id/nextjs';
const NEXTJS_MIDDLEWARE = `// middleware.ts
import { createAgentIDMiddleware } from '@agent-id/nextjs';

const agentID = createAgentIDMiddleware({
  blockUnauthorizedAgents: true,
});

export function middleware(request) {
  return agentID(request);
}

export const config = { matcher: '/api/:path*' };`;

const NEXTJS_USAGE = `// app/api/your-route/route.ts
import { getAgentIDResult } from '@agent-id/nextjs';

export async function GET(request) {
  const agent = getAgentIDResult(request);

  if (agent.verified) {
    // agent.claims.sub — stable pseudonymous user ID
    return Response.json({ ok: true, sub: agent.claims.sub });
  }

  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}`;

const EXPRESS_INSTALL = 'npm install @agent-id/express';
const EXPRESS_CODE = `import express from 'express';
import { agentID } from '@agent-id/express';

const app = express();
app.use(agentID({ blockUnauthorizedAgents: true }));

app.get('/api/data', (req, res) => {
  if (req.agentID?.verified) {
    // req.agentID.claims.sub — stable pseudonymous user ID
    res.json({ ok: true, sub: req.agentID.claims.sub });
  }
});`;

// ── Primitives ─────────────────────────────────────────────────────────────────

function CopyButton({ text, id }: { text: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={`Copy ${id}`}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:text-[#1500FF]"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3 w-3 text-[#1500FF]" />
          <span className="text-[#1500FF]">copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3 w-3" />
          copy
        </>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  id,
  lang = 'bash',
}: {
  code: string;
  id: string;
  lang?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-950">
      <div className="absolute inset-y-0 left-0 w-[2px] bg-[#1500FF]" />
      <div className="flex items-center justify-between border-b border-gray-800 py-2 pl-5 pr-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1500FF]/50">
          {lang}
        </span>
        <CopyButton text={code} id={id} />
      </div>
      <pre className="overflow-x-auto p-4 pl-5 text-xs leading-relaxed text-gray-300">
        {code}
      </pre>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1500FF] text-[10px] font-bold text-white">
        {n}
      </span>
      <div className="flex-1 text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#1500FF]">
      {children}
    </p>
  );
}

function SubTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-5 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
      {options.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
            value === id
              ? 'bg-[#1500FF] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Panels ─────────────────────────────────────────────────────────────────────

function AgentPanel() {
  const [client, setClient] = useState<AgentClient>('claudecode');

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel>How it works</SectionLabel>
        <div className="space-y-5">
          <Step n={1}>
            Install the AgentID MCP server into your AI client using one of the
            methods below.
          </Step>
          <Step n={2}>
            Ask your agent to authenticate. It opens a BankID QR code — scan it
            once with your BankID app to verify your identity.
          </Step>
          <Step n={3}>
            Every subsequent request your agent makes automatically carries a
            signed 1-hour certificate. Services that require AgentID will accept
            it without asking again.
          </Step>
        </div>
      </div>

      <div>
        <SectionLabel>Installation</SectionLabel>
        <SubTabs
          options={[
            { id: 'claudecode' as AgentClient, label: 'Claude Code' },
            { id: 'claudedesktop' as AgentClient, label: 'Claude Desktop' },
          ]}
          value={client}
          onChange={setClient}
        />

        {client === 'claudecode' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Run once in your terminal:</p>
            <CodeBlock code={CLAUDE_CODE_CMD} id="claudecode-cmd" lang="bash" />
            <p className="text-xs text-gray-500">Then prompt your agent:</p>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950 px-4 py-3">
              <span className="text-xs text-[#1500FF]/60">{'>'}&nbsp;</span>
              <span className="text-xs text-gray-300">
                Authenticate with AgentID so you can act on my behalf.
              </span>
            </div>
          </div>
        )}

        {client === 'claudedesktop' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Open{' '}
              <span className="text-gray-700">
                Settings → Developer → Edit Config
              </span>{' '}
              and merge in:
            </p>
            <CodeBlock
              code={CLAUDE_DESKTOP_CONFIG}
              id="desktop-config"
              lang="json"
            />
            <p className="text-xs text-gray-400">
              Restart Claude Desktop. The AgentID tools will appear
              automatically.
            </p>
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Available tools</SectionLabel>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          {[
            {
              name: 'start_authentication',
              desc: 'Start a BankID session — returns a URL for the user to scan.',
            },
            {
              name: 'complete_authentication',
              desc: 'Poll until BankID completes, then cache the signed JWT.',
            },
            {
              name: 'authenticated_fetch',
              desc: 'Make HTTP requests with the JWT attached as X-AgentID-Token.',
            },
          ].map((tool, i, arr) => (
            <div
              key={tool.name}
              className={`flex gap-5 px-5 py-4 ${
                i < arr.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <code className="w-48 shrink-0 text-xs text-[#1500FF]">
                {tool.name}
              </code>
              <p className="text-xs text-gray-500">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformPanel() {
  const [framework, setFramework] = useState<'nextjs' | 'express'>('nextjs');

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel>How it works</SectionLabel>
        <div className="space-y-5">
          <Step n={1}>
            Add the AgentID middleware to your API routes. It detects AI agent
            traffic automatically — human browser requests pass through
            untouched.
          </Step>
          <Step n={2}>
            Agent requests without a valid certificate receive a{' '}
            <code className="rounded bg-[#1500FF]/10 px-1 py-0.5 text-xs text-[#1500FF]">
              403
            </code>{' '}
            response. No configuration required for the detection logic.
          </Step>
          <Step n={3}>
            Verified requests expose a stable pseudonymous user ID — the same
            person always maps to the same{' '}
            <code className="rounded bg-[#1500FF]/10 px-1 py-0.5 text-xs text-[#1500FF]">
              sub
            </code>
            , but the personal number is never revealed.
          </Step>
        </div>
      </div>

      <div>
        <SectionLabel>Installation</SectionLabel>
        <SubTabs
          options={[
            { id: 'nextjs' as const, label: 'Next.js' },
            { id: 'express' as const, label: 'Express' },
          ]}
          value={framework}
          onChange={setFramework}
        />

        {framework === 'nextjs' && (
          <div className="space-y-4">
            <CodeBlock code={NEXTJS_INSTALL} id="nextjs-install" lang="bash" />
            <p className="text-xs text-gray-500">Add the middleware:</p>
            <CodeBlock
              code={NEXTJS_MIDDLEWARE}
              id="nextjs-middleware"
              lang="typescript"
            />
            <p className="text-xs text-gray-500">
              Read the verified identity in route handlers:
            </p>
            <CodeBlock
              code={NEXTJS_USAGE}
              id="nextjs-usage"
              lang="typescript"
            />
          </div>
        )}

        {framework === 'express' && (
          <div className="space-y-4">
            <CodeBlock
              code={EXPRESS_INSTALL}
              id="express-install"
              lang="bash"
            />
            <CodeBlock
              code={EXPRESS_CODE}
              id="express-middleware"
              lang="typescript"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#1500FF]/20 bg-[#1500FF]/5 p-5">
        <div className="flex gap-3">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#1500FF]" />
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-900">
              Fully offline verification
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              The middleware fetches the public key from{' '}
              <code className="text-[#1500FF]">
                agentidapp.vercel.app/api/jwks
              </code>{' '}
              once on startup, then verifies all subsequent tokens locally via
              RS256. No request is ever made back to AgentID at runtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<Tab>('agent');

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-2xl px-6 py-16">

        {/* Logo */}
        <div className="mb-12 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="agentID" className="h-14 w-auto" />
          <p className="text-[10px] tracking-[0.18em] text-gray-400">
            VERIFIED IDENTITY FOR AI AGENTS · POWERED BY BANKID
          </p>
        </div>

        {/* Master toggle */}
        <div className="mb-10 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1.5">
          <button
            onClick={() => setTab('agent')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === 'agent'
                ? 'bg-[#1500FF] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <AgentIcon className="h-4 w-4" />
            Install to your AI agent
          </button>
          <button
            onClick={() => setTab('platform')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === 'platform'
                ? 'bg-[#1500FF] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <PlatformIcon className="h-4 w-4" />
            Install to your web platform
          </button>
        </div>

        {/* Panel */}
        {tab === 'agent' ? <AgentPanel /> : <PlatformPanel />}

        {/* Footer */}
        <div className="mt-16 border-t border-gray-100 pt-8 text-center">
          <p className="text-[9px] tracking-[0.2em] text-gray-300">
            AGENTIDAPP.VERCEL.APP
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PlatformIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}
