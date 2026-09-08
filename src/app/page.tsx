import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export default async function LandingPage() {
  const user = await getCurrentUser();
  return <main><SiteHeader user={user} />
    <section className="marketing-hero" style={{ backgroundImage: `linear-gradient(90deg,#0b0909 0%,rgba(11,9,9,.9) 34%,rgba(11,9,9,.08) 78%),linear-gradient(0deg,#0b0909 0%,transparent 38%),url('${basePath}/assets/photos/team-overhead.webp')` }}>
      <div className="hero-copy"><p className="eyebrow">LIDERFLIX · INSTITUTO 2630</p><h1>LIDER<span>FLIX</span></h1><h2>A TRANSFORMAÇÃO<br />COMEÇA EM VOCÊ.</h2><p>Uma plataforma de liderança, estratégia e inteligência emocional para quem quer liderar melhor, construir equipes melhores e sustentar resultados melhores.</p><div className="actions"><Link className="button red" href={user ? "/catalogo" : "/cadastro"}>{user ? "CONTINUAR TREINAMENTO" : "ENCONTRAR MEU TREINAMENTO"}</Link><Link className="button outline" href="/#metodo">CONHECER O MÉTODO</Link></div><small>LIDERE-SE · MOVA-SE · ADAPTE-SE · SUSTENTE-SE</small></div>
    </section>
    <section className="manifesto" id="metodo"><p className="eyebrow red-text">MÉTODO DOS 4 PILARES 2630</p><h2>UM MÉTODO. 4 PILARES.<br /><span>UM LÍDER INTEIRO.</span></h2><p className="method-intro">O Instituto 2630 desenvolve líderes de dentro para fora. Cada treinamento conduz você por uma jornada prática de clareza, execução, relações e energia.</p><div className="pillars-grid">{[["01","LIDERE-SE","Princípios, valores e caráter"],["02","MOVA-SE","Objetivo, estratégia e ação"],["03","ADAPTE-SE","Repertório, relações e competências"],["04","SUSTENTE-SE","Energia física e mental"]].map(([number,title,description])=><div key={number}><strong>{number}</strong><span>{title}</span><small>{description}</small></div>)}</div></section>
    <section className="catalog-preview" id="catalogo"><div><p className="eyebrow">LIDERFLIX ORIGINAL</p><h2>CONTEÚDO PARA AÇÃO.<br />NÃO PARA A ESTANTE.</h2></div><div className="preview-grid">{[
      ["Liderança Antifrágil","Comando e cultura sob pressão","leadership-operators.webp"],
      ["Arquitetura da Decisão","Clareza em cenários complexos","decision-fire.webp"],
      ["O Código da Presença","Neurociência aplicada à liderança","presence-speaker.webp"]
    ].map(([title,description,image])=><article key={title} style={{backgroundImage:`linear-gradient(0deg,#080808 0%,rgba(8,8,8,.08) 76%),url('${basePath}/assets/photos/${image}')`}}><p>FORMAÇÃO 2630</p><h3>{title}</h3><span>{description}</span></article>)}</div><Link className="button red" href={user ? "/catalogo" : "/cadastro"}>ACESSAR A PLATAFORMA</Link></section>
    <footer className="site-footer"><span>INSTITUTO 2630 © 2026</span><span>LIDERFLIX · CONTEÚDO QUE FORMA LÍDERES</span><a href="https://instituto2630.com.br/">INSTITUTO2630.COM.BR</a></footer>
  </main>;
}
