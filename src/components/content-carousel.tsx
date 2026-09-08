"use client";

import { useEffect, useRef } from "react";

type Card = { title: string; description: string; image: string };

export function ContentCarousel({ cards, basePath }: { cards: Card[]; basePath: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const timer = window.setInterval(() => {
      const step = track.clientWidth < 700 ? track.clientWidth * 0.88 : track.clientWidth / 3;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 12;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: "smooth" });
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  function move(direction: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * (track.clientWidth < 700 ? track.clientWidth * 0.88 : track.clientWidth / 3), behavior: "smooth" });
  }

  return <div className="carousel-shell">
    <button className="carousel-arrow carousel-prev" type="button" aria-label="Conteúdo anterior" onClick={() => move(-1)}>‹</button>
    <div className="preview-grid" ref={trackRef}>
      {cards.map((card) => <article key={card.title} style={{ backgroundImage: `linear-gradient(0deg,#080808 0%,rgba(8,8,8,.08) 76%),url('${basePath}/assets/photos/${card.image}')` }}><p>FORMAÇÃO 2630</p><h3>{card.title}</h3><span>{card.description}</span></article>)}
    </div>
    <button className="carousel-arrow carousel-next" type="button" aria-label="Próximo conteúdo" onClick={() => move(1)}>›</button>
  </div>;
}
