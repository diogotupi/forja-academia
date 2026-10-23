import Image from "next/image";
import Link from "next/link";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/liderflix";

export function BrandLogo({ compact = false, destination = "/" }: { compact?: boolean; destination?: string }) {
  return <Link href={destination} className="brand-logo" aria-label="Academia de Liderança — Instituto 2630">
    <Image src={`${basePath}/assets/brand/instituto-2630-negative.png`} width={compact ? 34 : 52} height={compact ? 47 : 71} alt="Instituto 2630" priority />
    <span><strong>ACADEMIA DE<span> LIDERANÇA</span></strong><small>CONTEÚDO QUE FORMA LÍDERES</small></span>
  </Link>;
}
