# PathForge AI runtime

Node.js 22.13 or later is required. Install with `npm ci`, then run `npm run dev` and visit the printed loopback URL. Run `npm run build` for a Cloudflare Worker build. The Sites deployment preserves its own sign-in integration.

The local OpenAI key is held in the ignored `.env.local` file. Never add this file to Git or deliverable archives. Server variables are `OPENAI_API_KEY` and optional `OPENAI_MODEL` (default `gpt-4.1-mini`). Production Sites runtime secrets are configured separately; a local environment file is never uploaded as a secret.

The D1 binding is `DB`. The schema is declared in `db/schema.ts`, with its generated migration in `drizzle/`. Local and deployed databases are separate. Generate a build before applying a local migration with the documented Wrangler D1 command in the starter README.

The development sign-in uses the explicit local test identity, which is not production authentication. Hosted sign-in is owned by Sites. Guests retain a versioned browser workspace; authenticated workspaces use per-user storage and optimistic revisions. Group permissions are checked on every server request.

Learner code executes through `/api/runner`, with a restrictive worker response CSP, no networking/storage APIs, fixed cases, source-bound results, and a two-second parent timeout. Never execute learner code directly on the backend. Client evidence is for self-directed learning and is not an anti-cheating certification.

Run critical checks:

```text
node --experimental-strip-types --test lib/learning.test.ts lib/missions.test.ts lib/server.test.ts lib/simulations.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

The supported catalog contains focused JavaScript, SQL-subset, Git-simulator, engineering, communication, and artifact exercises. The interactive lab has 47 explicitly bounded computed models. AI paths use supported exercises and validate dependencies; unsupported goals must not be represented as a complete course. OpenAI feedback uses explicit per-request consent and never substitutes for deterministic verification. See the accompanying verification report for actual execution results and unmet master-brief requirements.

Design inspiration: [roadmap.sh](https://roadmap.sh/). Provider implementation follows [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). PathForge’s artwork, interface, and exercise content are original.
