import { z } from "zod";

export const MAX_WORKSPACE_BYTES = 500 * 1024;
export const MAX_AI_BYTES = 4 * 1024 * 1024;

export class RequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  constructor(message: string, status = 400, code = "invalid_request", details?: Record<string, unknown>) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

export function privateJson(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    Vary: "Cookie",
  } });
}

export function routeError(error: unknown): Response {
  if (error instanceof RequestError) {
    const response = privateJson({ error: error.message, code: error.code, ...error.details }, error.status);
    const seconds = error.details?.retryAfterSeconds;
    if (error.code.startsWith("ai_") && error.details?.retryable === true && typeof seconds === "number" && Number.isSafeInteger(seconds) && seconds >= 0) response.headers.set("Retry-After", String(seconds));
    return response;
  }
  if (error instanceof z.ZodError) return privateJson({ error: "The submitted fields are invalid. Check the input and try again.", code: "invalid_input" }, 400);
  // Do not leak database statements, provider response bodies, or credentials.
  return privateJson({ error: "The service could not save or load this request. Please retry; your local work remains available.", code: "service_unavailable" }, 503);
}

function retryDelay(value: string | null, now: number): number | undefined {
  if (!value || value.length > 128) return undefined;
  const numeric = /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;
  const seconds = Number.isFinite(numeric) ? Math.ceil(numeric) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isSafeInteger(seconds) && seconds >= 0 && seconds <= 31536000 ? seconds : undefined;
}

/** Classify only known code/type values. Provider messages can contain sensitive
 * request material and are deliberately never inspected, logged, or returned. */
export function providerFailure(status: number, payload: unknown, retryAfter: string | null = null, now = Date.now()): RequestError {
  const parsed = z.object({ error: z.object({ code: z.string().nullable().optional(), type: z.string().nullable().optional() }).passthrough() }).passthrough().safeParse(payload);
  const code = parsed.success ? parsed.data.error.code : undefined;
  const type = parsed.success ? parsed.data.error.type : undefined;
  const billingUrl = "https://platform.openai.com/settings/organization/billing";
  const limitsUrl = "https://platform.openai.com/settings/organization/limits";
  const common = { providerStatus: status, retryable: false };
  const insufficientQuota = () => new RequestError("OpenAI reports insufficient API quota. The account owner should check credits and spending limits; repeated retries will not restore access.", 503, "ai_insufficient_quota", { ...common, helpUrl: billingUrl, limitsUrl, starterModelOption: "gpt-6-luna" });
  // A specific code takes priority over a broad insufficient_quota type.
  if (code === "credit_balance_exhausted" || code === "billing_not_active") {
    return new RequestError("OpenAI API credits are unavailable or exhausted. The account owner must check API billing before retrying. Your learning progress is safe.", 503, "ai_credits_exhausted", { ...common, helpUrl: billingUrl, starterModelOption: "gpt-6-luna" });
  }
  if (["organization_spend_limit_exceeded", "project_spend_limit_exceeded", "organization_usage_limit_exceeded", "billing_hard_limit_reached"].includes(code ?? "")) {
    return new RequestError("The OpenAI account or project reached its API spending or usage limit. The account owner must review limits before retrying.", 503, "ai_spend_limit_reached", { ...common, helpUrl: limitsUrl });
  }
  if (code === "insufficient_quota") return insufficientQuota();
  if (status === 401 || code === "invalid_api_key") {
    return new RequestError("The AI provider did not authenticate the server's API key. The account owner must check its configuration before retrying.", 503, "ai_authentication_error", common);
  }
  if (status === 403) {
    return new RequestError("OpenAI denied access to this request. The account owner should check model and project permissions, key scope, and regional availability.", 503, "ai_access_denied", common);
  }
  if (status === 404 || code === "model_not_found") {
    return new RequestError("The configured AI model is unavailable to this project or could not be found. The account owner should check the model setting and access.", 503, "ai_model_unavailable", common);
  }
  const retryAfterSeconds = retryDelay(retryAfter, now);
  if (code === "rate_limit_exceeded" || code === "slow_down" || type === "rate_limit_error") {
    return new RequestError(retryAfterSeconds === undefined ? "OpenAI temporarily limited the request rate. Wait before retrying and send fewer concurrent requests." : `OpenAI temporarily limited the request rate. Wait at least ${retryAfterSeconds} seconds before retrying.`, 429, "ai_rate_limited", { providerStatus: status, retryable: true, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) });
  }
  if (type === "insufficient_quota") return insufficientQuota();
  if (status >= 500 || code === "server_is_overloaded") {
    return new RequestError("The AI provider is temporarily unavailable. Retry after a pause; your progress is safe.", 503, "ai_provider_unavailable", { providerStatus: status, retryable: true, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) });
  }
  if (status === 429) {
    return new RequestError("OpenAI rejected this request with a usage restriction. Its cause could not be identified safely. Ask the account owner to check API usage and billing before retrying.", 503, "ai_usage_restricted", { ...common, helpUrl: billingUrl, limitsUrl });
  }
  return new RequestError("The AI provider rejected this request. The account owner should check the configured model and request format. No learning progress was awarded.", 502, "ai_request_rejected", common);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new RequestError("This action must be submitted from this learning workspace.", 403, "invalid_origin");
  }
}

export async function readJson(request: Request, maximumBytes = MAX_WORKSPACE_BYTES): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) throw new RequestError("Submit JSON content.", 415, "unsupported_content_type");
  const advertised = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertised) && advertised > maximumBytes) throw new RequestError("This request is too large. Remove large attachments before saving.", 413, "request_too_large");
  if (!request.body) throw new RequestError("The request is empty.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > maximumBytes) {
        await reader.cancel();
        throw new RequestError("This request is too large. Remove large attachments before saving.", 413, "request_too_large");
      }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new RequestError("The request contains invalid JSON."); }
}

export const workspaceInputSchema = z.object({
  state: z.record(z.unknown()),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
}).strict();

export function encodeWorkspace(state: Record<string, unknown>): string {
  const encoded = JSON.stringify(state);
  if (new TextEncoder().encode(encoded).byteLength > MAX_WORKSPACE_BYTES) throw new RequestError("Your workspace is too large to synchronize. Export older evidence or remove large attachments.", 413, "workspace_too_large");
  return encoded;
}

type WorkspaceRow = { state: string; revision: number };
export async function loadWorkspace(db: D1Database, userId: string) {
  const row = await db.prepare("SELECT state, revision FROM workspaces WHERE user_id = ?").bind(userId).first<WorkspaceRow>();
  return row ? { state: JSON.parse(row.state) as Record<string, unknown>, revision: row.revision } : { state: null, revision: 0 };
}

export async function saveWorkspace(db: D1Database, userId: string, state: Record<string, unknown>, revision: number) {
  const encoded = encodeWorkspace(state);
  const statement = revision === 0
    ? db.prepare("INSERT INTO workspaces (user_id, state, revision) VALUES (?, ?, 1) ON CONFLICT(user_id) DO NOTHING RETURNING state, revision").bind(userId, encoded)
    : db.prepare("UPDATE workspaces SET state = ?, revision = revision + 1 WHERE user_id = ? AND revision = ? RETURNING state, revision").bind(encoded, userId, revision);
  const saved = await statement.first<WorkspaceRow>();
  if (!saved) throw new RequestError("Another session has newer saved progress. Reload the cloud copy before saving again.", 409, "revision_conflict", await loadWorkspace(db, userId));
  return { state: JSON.parse(saved.state) as Record<string, unknown>, revision: saved.revision };
}

export async function deleteWorkspace(db: D1Database, userId: string) {
  await db.batch([
    db.prepare("DELETE FROM contributions WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM room_members WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM evidence WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM workspaces WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM rooms WHERE NOT EXISTS (SELECT 1 FROM room_members WHERE room_members.room_code = rooms.code)"),
  ]);
}

export const roleSchema = z.enum(["structure", "behavior"]);
export type GroupRole = z.infer<typeof roleSchema>;
const codeSchema = z.string().regex(/^[A-Z2-9]{16}$/);
export const groupInputSchema = z.object({
  action: z.enum(["create", "join", "contribute", "leave"]),
  code: codeSchema.optional(),
  role: roleSchema.optional(),
  content: z.unknown().optional(),
  missionId: z.string().min(1).max(120).optional(),
}).strict();

const structureSchema = z.object({
  title: z.string().trim().min(3).max(100),
  fields: z.tuple([z.literal("name"), z.literal("email")]),
}).strict();
const behaviorSchema = z.object({ required: z.literal(true), emailValidation: z.literal(true) }).strict();

export function validateContribution(role: GroupRole, content: unknown) {
  // A limited declarative form builder, not a keyword check or arbitrary code.
  return role === "structure" ? structureSchema.parse(content) : behaviorSchema.parse(content);
}

export function validateSharedForm(structure: unknown, behavior: unknown, input: { name: string; email: string }) {
  const definition = structureSchema.parse(structure);
  const rules = behaviorSchema.parse(behavior);
  const errors: string[] = [];
  if (rules.required && !input.name.trim()) errors.push("Name is required.");
  if (rules.required && !input.email.trim()) errors.push("Email is required.");
  else if (rules.emailValidation && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("Enter a valid email address.");
  return { title: definition.title, valid: errors.length === 0, errors };
}

export function sharedFormChecks(structure: unknown, behavior: unknown) {
  return [
    { name: "Valid details accepted", passed: validateSharedForm(structure, behavior, { name: "Asha", email: "asha@example.com" }).valid },
    { name: "Missing name rejected", passed: !validateSharedForm(structure, behavior, { name: "", email: "asha@example.com" }).valid },
    { name: "Missing email rejected", passed: !validateSharedForm(structure, behavior, { name: "Asha", email: "" }).valid },
    { name: "Invalid email rejected", passed: !validateSharedForm(structure, behavior, { name: "Asha", email: "broken" }).valid },
  ];
}

export function randomRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // 32-character alphabet: exact uniform distribution, 80 bits of entropy.
  return Array.from(bytes, (byte) => alphabet[byte & 31]).join("");
}

type Member = { userId: string; role: GroupRole; name: string };
type ContributionRow = { userId: string; role: GroupRole; content: string; missionId: string; updatedAt: string };

async function memberFor(db: D1Database, code: string, userId: string): Promise<Member> {
  const member = await db.prepare("SELECT user_id AS userId, role, name FROM room_members WHERE room_code = ? AND user_id = ?").bind(code, userId).first<Member>();
  if (!member) throw new RequestError("Join this room with its invitation before accessing shared work.", 403, "not_a_member");
  return member;
}

export async function loadGroup(db: D1Database, code: string, userId: string) {
  codeSchema.parse(code);
  await memberFor(db, code, userId);
  const [members, rows] = await Promise.all([
    db.prepare("SELECT user_id AS userId, role, name FROM room_members WHERE room_code = ? ORDER BY role").bind(code).all<Member>(),
    db.prepare("SELECT user_id AS userId, role, content, mission_id AS missionId, updated_at AS updatedAt FROM contributions WHERE room_code = ? ORDER BY role").bind(code).all<ContributionRow>(),
  ]);
  const validContributions = rows.results.filter((row) => members.results.some((member) => member.userId === row.userId && member.role === row.role)).map((row) => ({ ...row, content: validateContribution(row.role, JSON.parse(row.content)) }));
  const structure = validContributions.find((entry) => entry.role === "structure");
  const behavior = validContributions.find((entry) => entry.role === "behavior");
  const checks = structure && behavior ? sharedFormChecks(structure.content, behavior.content) : [];
  const complete = members.results.length === 2 && new Set(members.results.map((member) => member.userId)).size === 2 && checks.length > 0 && checks.every((check) => check.passed);
  return { code, members: members.results, contributions: validContributions, complete, checks, attribution: "Each contribution demonstrates only its contributor's assigned task. Group completion is not independent verification of both roles." };
}

export async function mutateGroup(db: D1Database, user: { userId: string; displayName: string }, raw: unknown) {
  const input = groupInputSchema.parse(raw);
  const now = new Date().toISOString();
  if (input.action === "create") {
    const code = randomRoomCode();
    await db.batch([
      db.prepare("INSERT INTO rooms (code, created_at) VALUES (?, ?)").bind(code, now),
      db.prepare("INSERT INTO room_members (room_code, user_id, role, name, joined_at) VALUES (?, ?, ?, ?, ?)").bind(code, user.userId, input.role ?? "structure", user.displayName.slice(0, 120), now),
    ]);
    return loadGroup(db, code, user.userId);
  }
  if (!input.code) throw new RequestError("Enter the invitation code.");
  const code = input.code;
  if (input.action === "join") {
    // Possession of the high-entropy invitation code grants the right to join;
    // room contents are not returned until membership is actually established.
    const existing = await db.prepare("SELECT role FROM room_members WHERE room_code = ? AND user_id = ?").bind(code, user.userId).first<{ role: GroupRole }>();
    if (existing) return loadGroup(db, code, user.userId);
    const room = await db.prepare("SELECT code FROM rooms WHERE code = ?").bind(code).first();
    if (!room) throw new RequestError("This invitation was not found. Check the code.", 404, "room_not_found");
    const chosen = input.role ?? ((await db.prepare("SELECT role FROM room_members WHERE room_code = ?").bind(code).all<{ role: GroupRole }>()).results.some((member) => member.role === "structure") ? "behavior" : "structure");
    const joined = await db.prepare("INSERT OR IGNORE INTO room_members (room_code, user_id, role, name, joined_at) VALUES (?, ?, ?, ?, ?) RETURNING user_id").bind(code, user.userId, chosen, user.displayName.slice(0, 120), now).first();
    if (!joined) throw new RequestError("That role is already assigned. Each room has two complementary roles for two different learners.", 409, "role_unavailable");
    return loadGroup(db, code, user.userId);
  }
  const member = await memberFor(db, code, user.userId);
  if (input.action === "leave") {
    await db.batch([
      db.prepare("DELETE FROM contributions WHERE room_code = ? AND user_id = ?").bind(code, user.userId),
      db.prepare("DELETE FROM room_members WHERE room_code = ? AND user_id = ?").bind(code, user.userId),
      db.prepare("DELETE FROM rooms WHERE code = ? AND NOT EXISTS (SELECT 1 FROM room_members WHERE room_code = ?)").bind(code, code),
    ]);
    return { left: true, code };
  }
  if (input.role && input.role !== member.role) throw new RequestError("Submit only your assigned contribution.", 403, "wrong_role");
  const content = validateContribution(member.role, input.content);
  const stored = await db.prepare("INSERT INTO contributions (room_code, user_id, role, content, mission_id, updated_at) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM room_members WHERE room_code = ? AND user_id = ? AND role = ?) ON CONFLICT(room_code, user_id) DO UPDATE SET content = excluded.content, mission_id = excluded.mission_id, updated_at = excluded.updated_at RETURNING user_id").bind(code, user.userId, member.role, JSON.stringify(content), input.missionId ?? "collaboration", now, code, user.userId, member.role).first();
  if (!stored) throw new RequestError("Your room membership changed. Join again before submitting.", 403, "not_a_member");
  return loadGroup(db, code, user.userId);
}

const roadmapNodeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  title: z.string().trim().min(1).max(150),
  titleHi: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1200),
  prerequisites: z.array(z.string()).max(30),
  missionId: z.string().min(1).max(120),
  x: z.number().finite().min(-5000).max(5000),
  y: z.number().finite().min(-5000).max(5000),
}).strict();
export const roadmapSchema = z.object({ title: z.string().trim().min(1).max(150), description: z.string().trim().min(1).max(1500), nodes: z.array(roadmapNodeSchema).min(1).max(30) }).strict();
export type ValidatedRoadmap = z.infer<typeof roadmapSchema>;

export function validateRoadmap(raw: unknown, supportedMissionIds: readonly string[]): ValidatedRoadmap {
  const roadmap = roadmapSchema.parse(raw);
  const ids = new Set(roadmap.nodes.map((node) => node.id));
  if (ids.size !== roadmap.nodes.length) throw new RequestError("The generated route has duplicate topics. Please regenerate.", 502, "invalid_ai_roadmap");
  const allowed = new Set(supportedMissionIds);
  const byId = new Map(roadmap.nodes.map((node) => [node.id, node]));
  for (const node of roadmap.nodes) {
    if (!allowed.has(node.missionId)) throw new RequestError("The generated route requests an unavailable exercise. Please choose a supported learning goal.", 502, "invalid_ai_roadmap");
    if (new Set(node.prerequisites).size !== node.prerequisites.length || node.prerequisites.some((id) => id === node.id || !ids.has(id))) throw new RequestError("The generated route has invalid prerequisites. Please regenerate.", 502, "invalid_ai_roadmap");
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new RequestError("The generated route contains a prerequisite cycle. Please regenerate.", 502, "invalid_ai_roadmap");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)!.prerequisites) visit(dependency);
    visiting.delete(id); visited.add(id);
  }
  roadmap.nodes.forEach((node) => visit(node.id));
  return roadmap;
}

export type ExerciseDefinition = { id: string; title: string; titleHi: string; objective: string; prerequisites: string[] };

export function validateRoadmapForCatalog(raw: unknown, catalog: readonly ExerciseDefinition[]): ValidatedRoadmap {
  const roadmap = validateRoadmap(raw, catalog.map((mission) => mission.id));
  const byMission = new Map(roadmap.nodes.map((node) => [node.missionId, node]));
  const byNode = new Map(roadmap.nodes.map((node) => [node.id, node]));
  if (byMission.size !== roadmap.nodes.length) throw new RequestError("The generated route repeated an exercise. Please regenerate.", 502, "invalid_ai_roadmap");
  const definitions = new Map(catalog.map((mission) => [mission.id, mission]));
  function hasAncestor(id: string, ancestor: string): boolean {
    return byNode.get(id)!.prerequisites.some((dependency) => dependency === ancestor || hasAncestor(dependency, ancestor));
  }
  for (const node of roadmap.nodes) {
    const definition = definitions.get(node.missionId)!;
    for (const required of definition.prerequisites) {
      const dependency = byMission.get(required);
      if (!dependency || !hasAncestor(node.id, dependency.id)) throw new RequestError("The generated route omitted a required exercise prerequisite. Please regenerate.", 502, "invalid_ai_roadmap");
    }
  }
  // Keep task labels grounded in the actual available exercise. AI chooses a
  // relevant sequence and branches; it cannot relabel JavaScript as Python.
  return { ...roadmap, nodes: roadmap.nodes.map((node) => {
    const definition = definitions.get(node.missionId)!;
    return { ...node, title: definition.title, titleHi: definition.titleHi, description: definition.objective };
  }) };
}

export const aiInputSchema = z.object({
  mode: z.enum(["roadmap", "tutor", "teachback", "roleplay", "artifact", "documentation", "bridge"]),
  prompt: z.string().trim().min(1).max(16000),
  context: z.unknown().optional(),
  language: z.enum(["en", "hi", "English", "Hindi"]).default("en"),
  consentToOpenAI: z.boolean().optional(),
  imageData: z.string().max(3900000).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
}).strict();

export function requireProviderConsent(consent: boolean | undefined): void {
  if (consent !== true) throw new RequestError("Before using live AI, explicitly agree to send this prompt, relevant learning context, and any selected image to OpenAI. You can continue local activities without sharing.", 428, "provider_consent_required");
}

export const aiReplySchema = z.object({
  reply: z.string().min(1).max(16000),
  rubric: z.array(z.object({ criterion: z.string().max(160), feedback: z.string().max(1500), status: z.enum(["observed", "needs_practice", "uncertain"]) }).strict()).max(8).nullable().optional(),
  followUp: z.string().max(1600).nullable().optional(),
}).strict();

export function extractResponseText(raw: unknown): string {
  const envelope = z.object({ status: z.string().optional(), output: z.array(z.object({ type: z.string(), content: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional() }).passthrough()) }).passthrough().safeParse(raw);
  if (!envelope.success || (envelope.data.status && envelope.data.status !== "completed")) throw new RequestError("The AI response was incomplete. Retry without changing your saved progress.", 502, "ai_incomplete");
  const text = envelope.data.output.flatMap((item) => item.type === "message" ? item.content ?? [] : []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("");
  if (!text || text.length > 100000) throw new RequestError("The AI did not return a usable answer. Please retry.", 502, "invalid_ai_output");
  return text;
}
