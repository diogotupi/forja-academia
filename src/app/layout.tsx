import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "LiderFlix | Instituto 2630", template: "%s | LiderFlix" },
  description: "Conteúdos digitais do Instituto 2630 para liderança, estratégia e alta performance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={`${bebas.variable} ${montserrat.variable}`}><body>{children}</body></html>;
}
