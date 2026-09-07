import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, sha256 } from "@/lib/security";

export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({ error: "Origem inválida" }, { status: 403 }); }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash=$1", [sha256(token)]);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
