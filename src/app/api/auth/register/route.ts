import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { assertSameOrigin, checkRateLimit, normalizeEmail, normalizePhone } from "@/lib/security";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); checkRateLimit(`register:${request.headers.get("x-forwarded-for") ?? "local"}`, 5, 300_000);
    const data = registerSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await transaction(async (client) => {
      const user = await client.query<{ id: string }>("INSERT INTO users(name,email,phone,password_hash) VALUES($1,$2,$3,$4) RETURNING id", [data.name, normalizeEmail(data.email), normalizePhone(data.phone), passwordHash]);
      const session = await createSession(client, user.rows[0].id);
      return { userId: user.rows[0].id, ...session };
    });
    await setSessionCookie(result.token, result.expiresAt);
    return NextResponse.json({ ok: true, userId: result.userId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar a conta";
    const status = message.includes("users_email_unique") || message.includes("duplicate") ? 409 : 400;
    return NextResponse.json({ error: status === 409 ? "Este email já está cadastrado" : message }, { status });
  }
}
