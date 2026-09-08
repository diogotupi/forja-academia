import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage(){if(await getCurrentUser())redirect("/catalogo");return <main className="auth-page"><section><BrandLogo /><div><p className="eyebrow red-text">ACESSO LIDERFLIX</p><h1>VOLTE PARA<br />A SUA JORNADA.</h1><p>Entre para continuar seus cursos, materiais e progresso.</p><AuthForm mode="login" /></div></section><aside><blockquote>“Antes de liderar uma equipe, aprenda a liderar a si mesmo.”</blockquote><span>MÉTODO DOS 4 PILARES 2630</span></aside></main>}
