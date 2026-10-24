import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

// Native Node TypeScript support keeps this suite independent of app bundling.
const server = await import(new URL("./server.ts", import.meta.url).href) as typeof import("./server");
const { RequestError } = server;

function memoryDatabase() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE workspaces (user_id TEXT PRIMARY KEY, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE evidence (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, mission_id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE rooms (code TEXT PRIMARY KEY, created_at TEXT NOT NULL);
    CREATE TABLE room_members (room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('structure','behavior')), name TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY(room_code,user_id), UNIQUE(room_code,role));
    CREATE TABLE contributions (room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, user_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, mission_id TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(room_code,user_id), UNIQUE(room_code,role));
  `);
  function prepare(query: string, values: unknown[] = []) {
    const statement = sql.prepare(query);
    return {
      bind: (...args: unknown[]) => prepare(query, args),
      first: async () => statement.get(...values as never[]) ?? null,
      all: async () => ({ results: statement.all(...values as never[]), success: true }),
      run: async () => ({ success: true, meta: statement.run(...values as never[]) }),
    };
  }
  const db = {
    prepare,
    batch: async (statements: { run: () => Promise<unknown> }[]) => {
      sql.exec("BEGIN");
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sql.exec("COMMIT"); return results; }
      catch (error) { sql.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database;
  return { db, close: () => sql.close(), sql };
}

const alice = { userId: "learner-alice", displayName: "Alice" };
const bob = { userId: "learner-bob", displayName: "Bob" };
const outsider = { userId: "learner-cora", displayName: "Cora" };
const status = (expected: number) => (error: unknown) => error instanceof RequestError && error.status === expected;

test("origin validation rejects cross-origin and cross-site mutations", () => {
  assert.doesNotThrow(() => server.assertSameOrigin(new Request("https://learn.example/api/learn", { headers: { origin: "https://learn.example" } })));
  assert.throws(() => server.assertSameOrigin(new Request("https://learn.example/api/learn", { headers: { origin: "https://attacker.example" } })), status(403));
  assert.throws(() => server.assertSameOrigin(new Request("https://learn.example/api/learn", { headers: { "sec-fetch-site": "cross-site" } })), status(403));
});

test("JSON reader enforces actual streamed bytes and handles malformed input", async () => {
  const make = (body: string, type = "application/json") => new Request("https://learn.example", { method: "POST", headers: { "content-type": type }, body });
  assert.deepEqual(await server.readJson(make('{"goal":"SQL"}')), { goal: "SQL" });
  await assert.rejects(server.readJson(make("{")), status(400));
  await assert.rejects(server.readJson(make("x", "text/plain")), status(415));
  await assert.rejects(server.readJson(make(JSON.stringify({ long: "x".repeat(100) })), 25), status(413));
});

test("workspace envelope rejects arrays, invalid revisions and extra fields", () => {
  assert.equal(server.workspaceInputSchema.safeParse({ state: [], revision: 0 }).success, false);
  assert.equal(server.workspaceInputSchema.safeParse({ state: {}, revision: -1 }).success, false);
  assert.equal(server.workspaceInputSchema.safeParse({ state: {}, revision: 0, userId: "other-user" }).success, false);
  assert.throws(() => server.encodeWorkspace({ data: "🙂".repeat(140000) }), status(413));
});

test("workspace persistence isolates users and enforces optimistic revisions", async () => {
  const { db, close } = memoryDatabase();
  try {
    assert.deepEqual(await server.loadWorkspace(db, alice.userId), { state: null, revision: 0 });
    const initial = await server.saveWorkspace(db, alice.userId, { goal: "SQL", attempts: [] }, 0);
    assert.equal(initial.revision, 1);
    assert.deepEqual(await server.loadWorkspace(db, bob.userId), { state: null, revision: 0 });
    await assert.rejects(server.saveWorkspace(db, alice.userId, { goal: "overwritten" }, 0), (error: unknown) => status(409)(error) && (error as InstanceType<typeof RequestError>).details?.revision === 1);
    const changed = await server.saveWorkspace(db, alice.userId, { goal: "SQL", attempts: [{ id: "a1" }] }, 1);
    assert.equal(changed.revision, 2);
    assert.deepEqual((await server.loadWorkspace(db, alice.userId)).state?.attempts, [{ id: "a1" }]);
    await assert.rejects(server.saveWorkspace(db, bob.userId, {}, 4), status(409));
  } finally { close(); }
});

test("concurrent stale saves cannot both overwrite the canonical snapshot", async () => {
  const { db, close } = memoryDatabase();
  try {
    await server.saveWorkspace(db, alice.userId, { goal: "initial" }, 0);
    const saves = await Promise.allSettled([
      server.saveWorkspace(db, alice.userId, { goal: "session A" }, 1),
      server.saveWorkspace(db, alice.userId, { goal: "session B" }, 1),
    ]);
    assert.equal(saves.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(saves.filter((result) => result.status === "rejected").length, 1);
    assert.equal((await server.loadWorkspace(db, alice.userId)).revision, 2);
  } finally { close(); }
});

test("room membership is required before reading another learner's contributions", async () => {
  const { db, close } = memoryDatabase();
  try {
    const room = await server.mutateGroup(db, alice, { action: "create" });
    assert.ok("members" in room);
    await assert.rejects(server.loadGroup(db, room.code, outsider.userId), status(403));
    await assert.rejects(server.mutateGroup(db, outsider, { action: "contribute", code: room.code, role: "behavior", content: { required: true, emailValidation: true } }), status(403));
  } finally { close(); }
});

test("two distinct complementary contributions produce a tested shared form", async () => {
  const { db, close } = memoryDatabase();
  try {
    const room = await server.mutateGroup(db, alice, { action: "create", role: "structure" });
    await server.mutateGroup(db, bob, { action: "join", code: room.code, role: "behavior" });
    const first = await server.mutateGroup(db, alice, { action: "contribute", code: room.code, content: { title: "Join our learning group", fields: ["name", "email"] } });
    assert.equal("complete" in first && first.complete, false);
    const complete = await server.mutateGroup(db, bob, { action: "contribute", code: room.code, content: { required: true, emailValidation: true } });
    assert.ok("complete" in complete && complete.complete);
    if (!("checks" in complete)) throw new Error("Expected room snapshot");
    assert.equal(complete.checks.length, 4);
    assert.ok(complete.checks.every((check) => check.passed));
    assert.deepEqual(new Set(complete.contributions.map((entry) => entry.userId)), new Set([alice.userId, bob.userId]));
  } finally { close(); }
});

test("role ownership and maximum two distinct members are enforced", async () => {
  const { db, close } = memoryDatabase();
  try {
    const room = await server.mutateGroup(db, alice, { action: "create", role: "structure" });
    await assert.rejects(server.mutateGroup(db, bob, { action: "join", code: room.code, role: "structure" }), status(409));
    await server.mutateGroup(db, bob, { action: "join", code: room.code, role: "behavior" });
    await assert.rejects(server.mutateGroup(db, outsider, { action: "join", code: room.code }), status(409));
    await assert.rejects(server.mutateGroup(db, alice, { action: "contribute", code: room.code, role: "behavior", content: { required: true, emailValidation: true } }), status(403));
    const rejoined = await server.mutateGroup(db, alice, { action: "join", code: room.code, role: "behavior" });
    assert.ok("members" in rejoined && rejoined.members.length === 2);
    if ("members" in rejoined) assert.equal(rejoined.members.find((entry) => entry.userId === alice.userId)?.role, "structure");
  } finally { close(); }
});

test("contributions accept only safe declarative form definitions", () => {
  assert.throws(() => server.validateContribution("structure", { title: "test", fields: ["name", "email"], html: "<script>alert(1)</script>" }));
  assert.throws(() => server.validateContribution("behavior", { required: true, emailValidation: false }));
  assert.throws(() => server.validateContribution("behavior", "preventDefault input validation"));
  assert.deepEqual(server.validateContribution("behavior", { required: true, emailValidation: true }), { required: true, emailValidation: true });
});

test("leaving removes only the departing member's contribution and revokes read access", async () => {
  const { db, close } = memoryDatabase();
  try {
    const room = await server.mutateGroup(db, alice, { action: "create" });
    await server.mutateGroup(db, bob, { action: "join", code: room.code });
    await server.mutateGroup(db, alice, { action: "contribute", code: room.code, content: { title: "Join us", fields: ["name", "email"] } });
    await server.mutateGroup(db, bob, { action: "contribute", code: room.code, content: { required: true, emailValidation: true } });
    await server.mutateGroup(db, alice, { action: "leave", code: room.code });
    await assert.rejects(server.loadGroup(db, room.code, alice.userId), status(403));
    const remaining = await server.loadGroup(db, room.code, bob.userId);
    assert.equal(remaining.complete, false);
    assert.equal(remaining.members.length, 1);
    assert.equal(remaining.contributions[0].userId, bob.userId);
  } finally { close(); }
});

test("deletion removes learner data and evidence while preserving another learner's work", async () => {
  const { db, close, sql } = memoryDatabase();
  try {
    await server.saveWorkspace(db, alice.userId, { goal: "SQL" }, 0);
    await server.saveWorkspace(db, bob.userId, { goal: "Git" }, 0);
    sql.prepare("INSERT INTO evidence VALUES (?, ?, ?, ?, ?)").run("ev1", alice.userId, "query-learners", "{}", "2026-10-24");
    const room = await server.mutateGroup(db, alice, { action: "create" });
    await server.mutateGroup(db, bob, { action: "join", code: room.code });
    await server.deleteWorkspace(db, alice.userId);
    assert.deepEqual(await server.loadWorkspace(db, alice.userId), { state: null, revision: 0 });
    assert.equal((await server.loadWorkspace(db, bob.userId)).state?.goal, "Git");
    assert.equal(sql.prepare("SELECT count(*) AS count FROM evidence WHERE user_id = ?").get(alice.userId)?.count, 0);
    const group = await server.loadGroup(db, room.code, bob.userId);
    assert.equal(group.members.length, 1);
  } finally { close(); }
});

const node = (id: string, prerequisites: string[] = [], missionId = "first-function") => ({ id, title: id, titleHi: "विषय", description: "A practical task", prerequisites, missionId, x: 100, y: 100 });
const route = (nodes: ReturnType<typeof node>[]) => ({ title: "Learning", description: "A focused path", nodes });

test("roadmap validator accepts valid branches and rejects cycles/missing/duplicate dependencies", () => {
  assert.equal(server.validateRoadmap(route([node("a"), node("b", ["a"]), node("c", ["a"])]), ["first-function"]).nodes.length, 3);
  assert.throws(() => server.validateRoadmap(route([node("a", ["b"]), node("b", ["a"])]), ["first-function"]), status(502));
  assert.throws(() => server.validateRoadmap(route([node("a", ["missing"])]), ["first-function"]), status(502));
  assert.throws(() => server.validateRoadmap(route([node("a"), node("a")]), ["first-function"]), status(502));
  assert.throws(() => server.validateRoadmap(route([node("a"), node("b", ["a", "a"])]), ["first-function"]), status(502));
});

test("roadmap validator rejects unsupported missions and invalid or empty structure", () => {
  assert.throws(() => server.validateRoadmap(route([node("a", [], "imaginary-exercise")]), ["first-function"]), status(502));
  assert.throws(() => server.validateRoadmap(route([]), ["first-function"]));
  assert.throws(() => server.validateRoadmap(route([{ ...node("a"), x: Infinity }]), ["first-function"]));
});

test("catalog validation enforces exercise prerequisites and canonical task labels", () => {
  const catalog = [
    { id: "first-function", title: "JavaScript function", titleHi: "फ़ंक्शन", objective: "Write a JavaScript function", prerequisites: [] },
    { id: "fix-cart", title: "Repair the reducer", titleHi: "सुधारें", objective: "Repair a JavaScript reducer", prerequisites: ["first-function"] },
  ];
  const valid = server.validateRoadmapForCatalog(route([node("a"), node("b", ["a"], "fix-cart")]), catalog);
  assert.equal(valid.nodes[0].title, "JavaScript function");
  assert.equal(valid.nodes[1].description, "Repair a JavaScript reducer");
  assert.throws(() => server.validateRoadmapForCatalog(route([node("b", [], "fix-cart")]), catalog), status(502));
  assert.throws(() => server.validateRoadmapForCatalog(route([node("a"), node("b", [], "fix-cart")]), catalog), status(502));
  assert.throws(() => server.validateRoadmapForCatalog(route([node("a"), node("b")]), catalog), status(502));
});

test("provider feedback rejects incomplete/refused output and extracts actual response text", () => {
  assert.equal(server.extractResponseText({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: '{"reply":"Try an example"}' }] }] }), '{"reply":"Try an example"}');
  assert.throws(() => server.extractResponseText({ status: "incomplete", output: [] }), status(502));
  assert.throws(() => server.extractResponseText({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "No" }] }] }), status(502));
  assert.equal(server.aiReplySchema.safeParse({ reply: "You are verified", verified: true }).success, false);
});

test("live AI requires affirmative provider consent and validates supported image input", () => {
  assert.throws(() => server.requireProviderConsent(undefined), status(428));
  assert.throws(() => server.requireProviderConsent(false), status(428));
  assert.doesNotThrow(() => server.requireProviderConsent(true));
  assert.equal(server.aiInputSchema.safeParse({ mode: "artifact", prompt: "Review framing", imageData: "https://private-network/image", consentToOpenAI: true }).success, false);
  assert.equal(server.aiInputSchema.safeParse({ mode: "artifact", prompt: "Review framing", imageData: "data:image/png;base64,aGVsbG8=", consentToOpenAI: true }).success, true);
});

test("errors are private, actionable and do not expose unexpected service details", async () => {
  const response = server.routeError(new Error("secret-token postgres://credentials sql failure"));
  assert.equal(response.status, 503);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.doesNotMatch(await response.text(), /secret-token|postgres|credentials/);
  const consent = server.routeError(new RequestError("Consent is required", 428, "provider_consent_required"));
  assert.equal(((await consent.json()) as { code: string }).code, "provider_consent_required");
});

test("provider failures distinguish quota, rate limits and configuration without leaking raw messages", async () => {
  const secretMessage = "secret-token from private uploaded artifact";
  const quota = server.providerFailure(429, { error: { code: "insufficient_quota", type: "insufficient_quota", message: secretMessage } });
  assert.equal(quota.code, "ai_insufficient_quota");
  assert.equal(quota.details?.retryable, false);
  assert.equal(quota.details?.helpUrl, "https://platform.openai.com/settings/organization/billing");
  const credits = server.providerFailure(429, { error: { code: "credit_balance_exhausted", type: "insufficient_quota" } });
  assert.equal(credits.code, "ai_credits_exhausted");
  const spending = server.providerFailure(429, { error: { code: "project_spend_limit_exceeded", type: "insufficient_quota" } });
  assert.equal(spending.code, "ai_spend_limit_reached");
  const rate = server.providerFailure(429, { error: { code: "rate_limit_exceeded", message: secretMessage } }, "12.2");
  assert.equal(rate.code, "ai_rate_limited");
  assert.equal(rate.details?.retryAfterSeconds, 13);
  assert.equal(server.providerFailure(429, { error: { code: "slow_down", type: "insufficient_quota" } }).code, "ai_rate_limited");
  assert.equal(server.routeError(rate).headers.get("retry-after"), "13");
  const dateRate = server.providerFailure(429, { error: { code: "slow_down", type: "rate_limit_error" } }, "Sat, 24 Oct 2026 10:01:00 GMT", Date.parse("2026-10-24T10:00:00Z"));
  assert.equal(dateRate.details?.retryAfterSeconds, 60);
  const auth = server.providerFailure(401, { error: { code: "invalid_api_key", message: secretMessage } });
  assert.equal(auth.code, "ai_authentication_error");
  assert.equal(server.providerFailure(403, {}).code, "ai_access_denied");
  assert.equal(server.providerFailure(404, {}).code, "ai_model_unavailable");
  assert.equal(server.providerFailure(503, { error: { code: "server_is_overloaded" } }).details?.retryable, true);
  const unknown = server.providerFailure(429, { error: { code: "secret-token", type: "private-upload", message: secretMessage } }, "secret-token");
  assert.equal(unknown.code, "ai_usage_restricted");
  assert.equal(unknown.details?.retryAfterSeconds, undefined);
  for (const failure of [quota, rate, auth, unknown]) assert.doesNotMatch(await server.routeError(failure).text(), /secret-token|private-upload|uploaded artifact/);
});
