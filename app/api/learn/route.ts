import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { assertSameOrigin, deleteWorkspace, loadWorkspace, privateJson, readJson, RequestError, routeError, saveWorkspace, workspaceInputSchema } from "@/lib/server";

async function storage() {
  const user = await getChatGPTUser();
  if (!user) throw new RequestError("Sign in to synchronize progress. Guest learning stays on this device.", 401, "sign_in_required");
  if (!env.DB) throw new RequestError("Cloud saving is unavailable. Keep learning locally and retry later.", 503, "storage_unavailable");
  return { user, db: env.DB };
}

export async function GET() {
  try {
    const { user, db } = await storage();
    return privateJson({ ...await loadWorkspace(db, user.userId), user: { userId: user.userId, displayName: user.displayName } });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { user, db } = await storage();
    const { state, revision } = workspaceInputSchema.parse(await readJson(request));
    return privateJson(await saveWorkspace(db, user.userId, state, revision));
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const { user, db } = await storage();
    await deleteWorkspace(db, user.userId);
    return privateJson({ deleted: true, state: null, revision: 0 });
  } catch (error) { return routeError(error); }
}
