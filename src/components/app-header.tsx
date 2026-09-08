import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { BrandLogo } from "./brand-logo";
import { LogoutButton } from "./logout-button";

export function AppHeader({user}:{user:CurrentUser}){return <header className="app-header"><BrandLogo compact destination="/catalogo"/><nav><Link href="/catalogo">Início</Link><Link href="/catalogo#meus-cursos">Meus cursos</Link><Link href="/ebooks">E-books</Link>{user.role==="ADMIN"&&<Link href="/admin">Admin</Link>}</nav><div className="user-chip"><span>{user.name}</span><b>{user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</b><LogoutButton/></div></header>}
