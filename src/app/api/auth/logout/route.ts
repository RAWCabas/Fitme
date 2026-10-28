import { jsonResponse } from "@/lib/http";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  return jsonResponse({ ok: true });
}
