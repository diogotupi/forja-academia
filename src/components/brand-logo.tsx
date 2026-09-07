import Image from "next/image";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-logo" aria-label="LiderFlix — Instituto 2630">
    <Image src={`${basePath}/assets/brand/instituto-2630-logo.png`} width={compact ? 34 : 52} height={compact ? 47 : 71} alt="Instituto 2630" priority />
    <span><strong>LIDER<span>FLIX</span></strong><small>CONTEÚDO QUE FORMA LÍDERES</small></span>
  </Link>;
}
