import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Cabecalho } from "../components/cabecalho";
import { NOME_COOKIE, obterSessao } from "../lib/sessao";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nortesys | Base de Conhecimento",
  description: "Base de conhecimento interna da equipe de suporte.",
  robots: { index: false, follow: false, nocache: true },
};
export default async function RootLayout({ children }: { children: ReactNode }) {
  const usuario = await obterSessao((await cookies()).get(NOME_COOKIE)?.value).catch(() => null);
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
        {usuario ? <Cabecalho nome={usuario.nome} /> : null}
        {children}
        {usuario ? <footer className="rodape-site no-print"><div className="conteiner py-6 text-sm leading-6 text-[var(--muted)]">Nortesys · Base de Conhecimento · Fase 5.5 · Acesso restrito.</div></footer> : null}
      </body>
    </html>
  );
}
