import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { assertSameOrigin, checkRateLimit, normalizeEmail, randomToken, sha256 } from "@/lib/security";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); checkRateLimit(`forgot:${request.headers.get("x-forwarded-for") ?? "local"}`, 4, 600_000);
    const email = normalizeEmail(String((await request.json()).email ?? ""));
    const result = await query<{ id: string; name: string }>("SELECT id,name FROM users WHERE email=$1", [email]);
    if (result.rows[0]) {
      const token = randomToken();
      await transaction(async (client) => {
        await client.query("DELETE FROM password_reset_tokens WHERE user_id=$1 AND used_at IS NULL", [result.rows[0].id]);
        await client.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 minutes')", [result.rows[0].id, sha256(token)]);
      });
      await sendPasswordResetEmail({ email, name: result.rows[0].name, token });
    }
    return NextResponse.json({ ok: true, message: "Se o email existir, enviaremos as instruções." });
  } catch { return NextResponse.json({ ok: true, message: "Se o email existir, enviaremos as instruções." }); }
}
