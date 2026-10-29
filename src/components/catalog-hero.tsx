"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "./arrow-icon";

type HeroCourse = { id: string; slug: string; title: string; description: string; thumbnail: string | null; category: string; lesson_count: number; has_access: boolean };
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export function CatalogHero({ courses }: { courses: HeroCourse[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const slides = [{
    id: "academy", title: "Sua próxima evolução começa aqui.",
    description: "Liderança, estratégia e inteligência emocional. Explore as formações do Instituto 2630 e escolha o próximo passo da sua jornada.",
    image: `${basePath}/assets/photos/team-overhead.webp`, label: "ACADEMIA DE LIDERANÇA",
    href: "#catalogo", action: "Explorar catálogo", thumbnailTitle: "Conheça a Academia",
  }, ...courses.map(course => ({
    id: course.id, title: course.title, description: course.description,
    image: course.thumbnail || `${basePath}/assets/banners/presenca.png`,
    label: `${course.category} · ${course.lesson_count} aulas`, href: `/curso/${course.slug}`,
    action: course.has_access ? "Acessar curso" : "Conhecer curso", thumbnailTitle: course.title,
  }))];
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || interacting || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reducedMotion, slides.length]);
  const selected = slides[active] ?? slides[0];
  function move(direction: number) {
    setPaused(true);
    setActive(index => (index + direction + slides.length) % slides.length);
  }
  return <section className="catalog-hero" aria-label="Destaques da Academia" aria-roledescription="carrossel"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div className="catalog-hero-image" key={selected.id} style={{ backgroundImage: `linear-gradient(90deg, #0c0a0af5 0%, #0c0a0a9c 55%, #0c0a0a30), linear-gradient(0deg, #0c0a0a 0%, transparent 65%), url('${selected.image}')` }} />
    <div className="catalog-hero-copy">
      <p className="eyebrow">{selected.label}</p>
      <h1>{selected.title}</h1>
      <p className="catalog-hero-description">{selected.description}</p>
      <Link className="button red" href={selected.href}>{selected.action}<ArrowIcon /></Link>
    </div>
    <div className="catalog-hero-navigation">
      <div className="catalog-hero-heading"><span>EXPLORE A ACADEMIA</span><div>
        {!reducedMotion && <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Ativar rotação automática" : "Pausar rotação automática"}>{paused ? "Reproduzir" : "Pausar"}</button>}
        <button type="button" onClick={() => move(-1)} aria-label="Destaque anterior"><span className="arrow-back"><ArrowIcon /></span></button>
        <span className="hero-counter">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Próximo destaque"><ArrowIcon /></button>
      </div></div>
      <div className="catalog-hero-thumbnails" aria-label="Selecionar destaque">
        {slides.map((slide, index) => <button type="button" key={slide.id} aria-pressed={index === active} onClick={() => { setActive(index); setPaused(true); }} style={{ backgroundImage: `linear-gradient(0deg, #050505ed, #05050515), url('${slide.image}')` }}><span>{slide.thumbnailTitle}</span></button>)}
      </div>
    </div>
  </section>;
}
