import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage(){if(await getCurrentUser())redirect("/catalogo");return <main className="auth-page"><section><BrandLogo /><div><p className="eyebrow red-text">CADASTRO GRATUITO</p><h1>SEU PRÓXIMO NÍVEL<br />COMEÇA AGORA.</h1><p>Crie sua conta sem assinatura. Explore cursos, e-books e benefícios do Instituto 2630.</p><AuthForm mode="register" /></div></section><aside className="register-visual"><blockquote>DISCIPLINA.<br />ESTRATÉGIA.<br /><b>EXECUÇÃO.</b></blockquote></aside></main>}
