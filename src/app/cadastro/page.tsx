import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage(){if(await getCurrentUser())redirect("/catalogo");return <main className="auth-page"><section><BrandLogo /><div><p className="eyebrow red-text">CADASTRO GRATUITO</p><h1>SEU PRÓXIMO NÍVEL<br />COMEÇA AGORA.</h1><p>Crie sua conta sem assinatura. Encontre o treinamento certo para o momento da sua jornada.</p><AuthForm mode="register" /></div></section><aside className="register-visual"><blockquote>QUANDO O LÍDER MUDA,<br />O QUE ELE LIDERA<br /><b>TAMBÉM PODE MUDAR.</b></blockquote></aside></main>}
