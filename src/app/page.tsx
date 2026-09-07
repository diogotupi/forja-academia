import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export default async function LandingPage() {
  const user = await getCurrentUser();
  return <main><SiteHeader user={user} />
    <section className="marketing-hero" style={{ backgroundImage: `linear-gradient(90deg,#050505 0%,rgba(5,5,5,.92) 35%,rgba(5,5,5,.15) 76%),linear-gradient(0deg,#050505 0%,transparent 35%),url('${basePath}/assets/banners/presenca.png')` }}>
      <div className="hero-copy"><p className="eyebrow">INSTITUTO 2630 APRESENTA</p><h1>LIDER<span>FLIX</span></h1><h2>CONHECIMENTO PARA<br />QUEM ESTÁ NO COMANDO.</h2><p>Uma plataforma de liderança, estratégia, inteligência emocional e alta performance construída a partir da experiência de quem liderou sob pressão real.</p><div className="actions"><Link className="button red" href={user ? "/catalogo" : "/cadastro"}>{user ? "CONTINUAR TREINAMENTO" : "CRIAR CONTA GRATUITA"}</Link><Link className="button outline" href="/#catalogo">EXPLORAR CONTEÚDOS</Link></div><small>CONTA GRATUITA · CONTEÚDOS GRATUITOS E PREMIUM</small></div>
    </section>
    <section className="manifesto" id="manifesto"><p className="eyebrow red-text">METODOLOGIA CAVEIRA</p><h2>A VERDADEIRA LIDERANÇA<br />COMEÇA PELA <span>COMPREENSÃO DE SI.</span></h2><div className="manifesto-grid"><p>Não treinamos apenas o corpo. Desenvolvemos disciplina, estratégia e mentalidade para transformar indivíduos e equipes em ambientes de pressão.</p><div><strong>01</strong><span>LIDERANÇA</span></div><div><strong>02</strong><span>ESTRATÉGIA</span></div><div><strong>03</strong><span>PERFORMANCE</span></div></div></section>
    <section className="catalog-preview" id="catalogo"><div><p className="eyebrow">LIDERFLIX ORIGINAL</p><h2>CONTEÚDO PARA AÇÃO.<br />NÃO PARA A ESTANTE.</h2></div><div className="preview-grid">{[
      ["Liderança Antifrágil","Comando e cultura sob pressão","resiliencia.png"],
      ["Arquitetura da Decisão","Clareza em cenários complexos","foco.png"],
      ["O Código da Presença","Neurociência aplicada à liderança","presenca.png"]
    ].map(([title,description,image])=><article key={title} style={{backgroundImage:`linear-gradient(0deg,#080808 0%,transparent 75%),url('${basePath}/assets/banners/${image}')`}}><p>FORMAÇÃO 2630</p><h3>{title}</h3><span>{description}</span></article>)}</div><Link className="button red" href={user ? "/catalogo" : "/cadastro"}>ACESSAR A PLATAFORMA</Link></section>
    <footer className="site-footer"><span>INSTITUTO 2630 © 2026</span><span>LIDERFLIX · CONTEÚDO QUE FORMA LÍDERES</span><a href="https://instituto2630.com.br/">INSTITUTO2630.COM.BR</a></footer>
  </main>;
}
