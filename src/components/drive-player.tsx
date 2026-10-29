"use client";

import { useEffect, useRef, useState } from "react";

export function DrivePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ width: number; height: number; scale: number } | null>(null);
  useEffect(() => {
    const element = shell.current;
    if (!element) return;
    // Give the embedded controls a stable layout, then fit the whole player.
    // Narrow iframe viewports can clip Drive's mobile control overlay.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const scale = Math.min(width / 640, height / 360, 1);
      setFrame({ width: width / scale, height: height / scale, scale });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
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
    <div ref={shell} className="video-shell drive-video-shell">
      <iframe style={frame ? { width: frame.width, height: frame.height, transform: `scale(${frame.scale})`, transformOrigin: "top left" } : undefined} src={`https://drive.google.com/file/d/${encodeURIComponent(videoId)}/preview`} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
    <div className="player-tools">
      <button ref={toggle} type="button" className="button outline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Voltar à aula" : "Ampliar vídeo"}</button>
    </div>
  </div>;
}
