import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { listCatalog } from "@/lib/catalog";

const basePath=process.env.NEXT_PUBLIC_BASE_PATH??"/liderflix";
const fallbackImage=`${basePath}/assets/banners/presenca.png`;
export const dynamic="force-dynamic";

export default async function CatalogPage(){const user=await requireUser();const courses=await listCatalog(user.id);const owned=courses.filter(c=>c.has_access);const featured=courses[0];return <main className="platform"><AppHeader user={user}/>
  {featured&&<section className="platform-hero" style={{backgroundImage:`linear-gradient(90deg,#050505 0%,#050505e5 35%,transparent 80%),linear-gradient(0deg,#050505,transparent 35%),url('${featured.thumbnail||fallbackImage}')`}}><div><p className="eyebrow red-text">DESTAQUE LIDERFLIX</p><h1>{featured.title}</h1><p>{featured.description}</p><div><span>{featured.instructor}</span><span>{featured.lesson_count} aulas</span><span>{featured.level}</span></div><Link className="button red" href={`/curso/${featured.slug}`}>{featured.has_access?"CONTINUAR":"CONHECER O CURSO"}</Link></div></section>}
  <div className="platform-content"><section id="meus-cursos"><div className="section-title"><div><p className="eyebrow">SUA JORNADA</p><h2>CONTINUE ASSISTINDO</h2></div></div>{owned.length?<div className="course-row">{owned.map(course=><CourseCard key={course.id} course={course}/>)}</div>:<div className="empty-state"><h3>VOCÊ AINDA NÃO POSSUI CURSOS.</h3><p>Sua conta é gratuita e já está ativa. Explore o catálogo e escolha seu próximo treinamento.</p><a className="button red" href="#catalogo">EXPLORAR LIDERFLIX</a></div>}</section>
  <section id="catalogo"><div className="section-title"><div><p className="eyebrow red-text">FORMAÇÕES INSTITUTO 2630</p><h2>CATÁLOGO</h2></div><span>{courses.length} CONTEÚDOS</span></div><div className="course-grid">{courses.map(course=><CourseCard key={course.id} course={course}/>)}</div></section></div></main>}

function CourseCard({course}:{course:Awaited<ReturnType<typeof listCatalog>>[number]}){return <Link href={`/curso/${course.slug}`} className="course-card" style={{backgroundImage:`linear-gradient(0deg,#070707 0%,transparent 75%),url('${course.thumbnail||fallbackImage}')`}}><div className="course-state">{course.has_access?"ACESSO LIBERADO":course.included_in_all_access?"INCLUSO NO LIDERFLIX COMPLETO":"CONTEÚDO PREMIUM"}</div><div><p>{course.category}</p><h3>{course.title}</h3><span>{course.instructor} · {course.lesson_count} aulas</span>{course.has_access&&<div className="progress"><i style={{width:`${course.progress_percent}%`}}/></div>}</div></Link>}
