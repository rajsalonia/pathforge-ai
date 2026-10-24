import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { assertSameOrigin, loadGroup, mutateGroup, privateJson, readJson, RequestError, routeError } from "@/lib/server";

async function storage() {
  const user = await getChatGPTUser();
  if (!user) throw new RequestError("Sign in to work with another learner. Each contribution needs a distinct identity.", 401, "sign_in_required");
  if (!env.DB) throw new RequestError("Shared learning is temporarily unavailable. Please retry later.", 503, "storage_unavailable");
  return { user, db: env.DB };
}

export async function GET(request: Request) {
  try {
    const { user, db } = await storage();
    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
    return privateJson(await loadGroup(db, code, user.userId));
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { user, db } = await storage();
    return privateJson(await mutateGroup(db, user, await readJson(request, 12000)));
  } catch (error) { return routeError(error); }
}
