import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { assertSameOrigin, checkRateLimit, normalizeEmail } from "@/lib/security";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); checkRateLimit(`login:${request.headers.get("x-forwarded-for") ?? "local"}`, 8, 300_000);
    const data = loginSchema.parse(await request.json());
    const result = await query<{ id: string; password_hash: string }>("SELECT id,password_hash FROM users WHERE email=$1", [normalizeEmail(data.email)]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
    const session = await transaction(async (client) => {
      await client.query("UPDATE users SET last_login_at=now(),updated_at=now() WHERE id=$1", [user.id]);
      return createSession(client, user.id);
    });
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha no login" }, { status: 400 });
  }
}
