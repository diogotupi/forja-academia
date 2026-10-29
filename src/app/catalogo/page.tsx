import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import { query } from "@/lib/db";
import { CatalogHero } from "@/components/catalog-hero";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { listCatalog } from "@/lib/catalog";

const basePath=process.env.NEXT_PUBLIC_BASE_PATH??"/liderflix";
const fallbackImage=`${basePath}/assets/banners/presenca.png`;
export const dynamic="force-dynamic";

export default async function CatalogPage(){const user=await requireUser();const courses=await listCatalog(user.id);const academyOffer=(await query<{slug:string}>("SELECT slug FROM offers WHERE resource_type='ALL_ACCESS' AND active=true LIMIT 1")).rows[0];const owned=courses.filter(c=>c.has_access);return <main className="platform"><AppHeader user={user}/>
  <CatalogHero courses={courses.map(({id,slug,title,description,thumbnail,category,lesson_count,has_access})=>({id,slug,title,description,thumbnail,category,lesson_count,has_access}))}/>
  <div className="platform-content">{academyOffer&&<section className="academy-plan"><div><p className="eyebrow">TODOS OS CURSOS. UMA ASSINATURA.</p><h2>Academia de Liderança</h2><p>Acesso a todos os cursos atuais e aos próximos lançamentos enquanto sua assinatura estiver ativa.</p><strong>R$ 49,99 <small>/ mês</small></strong></div><CheckoutButton offerId={academyOffer.slug} label="ASSINAR A ACADEMIA"/></section>}<section id="meus-cursos"><div className="section-title"><div><p className="eyebrow">SUA JORNADA</p><h2>CONTINUE ASSISTINDO</h2></div></div>{owned.length?<div className="course-row">{owned.map(course=><CourseCard key={course.id} course={course}/>)}</div>:<div className="empty-state"><h3>VOCÊ AINDA NÃO POSSUI CURSOS.</h3><p>Sua conta é gratuita e já está ativa. Explore o catálogo e escolha seu próximo treinamento.</p><a className="button red" href="#catalogo">EXPLORAR ACADEMIA DE LIDERANÇA</a></div>}</section>
  <section id="catalogo"><div className="section-title"><div><p className="eyebrow red-text">FORMAÇÕES INSTITUTO 2630</p><h2>CATÁLOGO</h2></div><span>{courses.length} CONTEÚDOS</span></div><div className="course-grid">{courses.map(course=><CourseCard key={course.id} course={course}/>)}</div></section></div></main>}

function CourseCard({course}:{course:Awaited<ReturnType<typeof listCatalog>>[number]}){return <Link href={`/curso/${course.slug}`} className="course-card" style={{backgroundImage:`linear-gradient(0deg,#070707 0%,transparent 75%),url('${course.thumbnail||fallbackImage}')`}}><div className="course-state">{course.has_access?"ACESSO LIBERADO":course.included_in_all_access?"INCLUSO NA ACADEMIA":"CONTEÚDO PREMIUM"}</div><div><p>{course.category}</p><h3>{course.title}</h3><span>{course.instructor} · {course.lesson_count} aulas</span>{course.has_access&&<div className="progress"><i style={{width:`${course.progress_percent}%`}}/></div>}</div></Link>}
