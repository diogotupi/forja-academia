import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import type { CurrentUser } from "@/lib/auth";

export function SiteHeader({ user }: { user?: CurrentUser | null }) {
  return <header className="site-header"><BrandLogo compact /><nav><Link href="/#manifesto">A plataforma</Link><Link href="/#catalogo">Conteúdos</Link><a href="https://instituto2630.com.br/" target="_blank" rel="noreferrer">Instituto 2630</a></nav><div className="header-cta">{user ? <Link className="button red" href="/catalogo">Entrar na LiderFlix</Link> : <><Link href="/login">Entrar</Link><Link className="button red" href="/cadastro">Criar conta grátis</Link></>}</div></header>;
}
