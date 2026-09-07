import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) throw new Error("Telefone inválido");
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = new Set((process.env.TRUSTED_ORIGINS ?? "http://localhost:3000").split(",").map((item) => item.trim()));
  if (!allowed.has(origin)) throw new Error("Origem não permitida");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const attempts = new Map<string, { count: number; resetAt: number }>();
export function checkRateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now(); const current = attempts.get(key);
  if (!current || current.resetAt < now) { attempts.set(key, { count: 1, resetAt: now + windowMs }); return; }
  if (current.count >= limit) throw new Error("Muitas tentativas. Aguarde e tente novamente.");
  current.count += 1;
}
