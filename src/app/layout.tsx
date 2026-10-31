import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import pacote from "../../package.json";
import { EstruturaAplicacao } from "../components/estrutura-aplicacao";
import { sessaoAtual } from "../lib/autenticacao-servidor";
import "./globals.css";

const fonteSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-ibm-sans",
});
const fonteMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-ibm-mono",
});

const temaAntesDaHidratacao = `(() => {
  try {
    const preferencia = localStorage.getItem("nortesys-kb-tema");
    document.documentElement.dataset.theme = preferencia === "escuro" ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();`;

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nortesys | Base de Conhecimento",
  description: "Base de conhecimento interna da equipe de suporte.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [usuario, cabecalhos] = await Promise.all([
    sessaoAtual().catch(() => null),
    headers(),
  ]);
  const nonce = cabecalhos.get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" className={`${fonteSans.variable} ${fonteMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: temaAntesDaHidratacao }} />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
        {usuario ? (
          <EstruturaAplicacao nome={usuario.nome} papel={usuario.papel} versao={pacote.version}>
            {children}
          </EstruturaAplicacao>
        ) : children}
      </body>
    </html>
  );
}
