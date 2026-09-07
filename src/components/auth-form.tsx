"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch(`${basePath}/api/auth/${mode === "login" ? "login" : "register"}`, { method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body) });
    const result = await response.json(); setLoading(false);
    if (!response.ok) { setError(result.error ?? "Não foi possível continuar"); return; }
    router.push("/catalogo"); router.refresh();
  }
  return <form className="auth-form" onSubmit={submit}>
    {mode === "register" && <><label>NOME COMPLETO<input name="name" required minLength={2} autoComplete="name" /></label><label>TELEFONE<input name="phone" required placeholder="(21) 99999-9999" autoComplete="tel" /></label></>}
    <label>EMAIL<input name="email" type="email" required autoComplete="email" /></label><label>SENHA<input name="password" type="password" required minLength={mode === "register" ? 10 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} /></label>
    {mode === "register" && <small>Use ao menos 10 caracteres, uma letra maiúscula e um número.</small>}
    {error && <p className="form-error" role="alert">{error}</p>}<button className="button red" disabled={loading}>{loading ? "PROCESSANDO..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA GRATUITA"}</button>
    <div className="form-links">{mode === "login" ? <><Link href="/recuperar-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar conta grátis</Link></> : <><span>Já possui uma conta?</span><Link href="/login">Entrar</Link></>}</div>
  </form>;
}
