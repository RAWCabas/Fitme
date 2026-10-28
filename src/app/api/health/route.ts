import { jsonResponse } from "@/lib/http";
import { getDataStore, getVersion } from "@/lib/config";
import { nowIso } from "@/lib/dates";

export async function GET() {
  return jsonResponse({
    ok: true,
    version: getVersion(),
    store: getDataStore(),
    timestamp: nowIso(),
  });
}

