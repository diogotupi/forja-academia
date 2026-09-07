import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { assertSameOrigin, sha256 } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { token, password } = await request.json();
    if (typeof token !== "string" || typeof password !== "string" || password.length < 10) throw new Error("Dados inválidos");
    await transaction(async (client) => {
      const reset = await client.query<{ id: string; user_id: string }>("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE", [sha256(token)]);
      if (!reset.rows[0]) throw new Error("Link inválido ou expirado");
      await client.query("UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2", [await bcrypt.hash(password, 12), reset.rows[0].user_id]);
      await client.query("UPDATE password_reset_tokens SET used_at=now() WHERE id=$1", [reset.rows[0].id]);
      await client.query("DELETE FROM sessions WHERE user_id=$1", [reset.rows[0].user_id]);
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao redefinir senha" }, { status: 400 }); }
}
