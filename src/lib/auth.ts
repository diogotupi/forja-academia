import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security";

export const SESSION_COOKIE = "liderflix_session";
export type CurrentUser = { id: string; name: string; email: string; phone: string; role: "USER" | "ADMIN" };

export async function createSession(client: PoolClient, userId: string) {
  const token = randomToken();
  const days = Number(process.env.SESSION_DAYS ?? 30);
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await client.query("INSERT INTO sessions(user_id, token_hash, expires_at) VALUES($1,$2,$3)", [userId, sha256(token), expiresAt]);
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function clearSessionCookie() {
  const jar = await cookies(); jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<CurrentUser>(`SELECT u.id,u.name,u.email,u.phone,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [sha256(token)]);
  return result.rows[0] ?? null;
}

export async function requireUser() { const user = await getCurrentUser(); if (!user) redirect("/login"); return user; }
export async function requireAdmin() { const user = await requireUser(); if (user.role !== "ADMIN") redirect("/"); return user; }
