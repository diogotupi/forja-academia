"use client";

import { useEffect, useRef, useState } from "react";

export function DrivePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setExpanded(false); toggle.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);
  return <div className={`video-player${expanded ? " is-expanded" : ""}`}>
    <div className="video-shell">
      <iframe src={`https://drive.google.com/file/d/${encodeURIComponent(videoId)}/preview`} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
    <div className="player-tools">
      <button ref={toggle} type="button" className="button outline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Voltar à aula" : "Ampliar vídeo"}</button>
      <a className="button outline" href={`https://drive.google.com/file/d/${encodeURIComponent(videoId)}/view`} target="_blank" rel="noopener noreferrer">Abrir no Drive ↗</a>
    </div>
  </div>;
}
