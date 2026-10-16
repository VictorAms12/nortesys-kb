import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirSessao } from "../../lib/autenticacao-servidor";
import { carregarArtigos } from "../../lib/artigos";
import { criarIndiceBusca } from "../../lib/indice-busca";
import { PainelBusca } from "../../components/painel-busca";

export const metadata: Metadata = {
  title: "Buscar artigos | Nortesys KB",
  description: "Pesquise procedimentos, sintomas e códigos de erro na base de conhecimento.",
};

export default async function PaginaBusca() {
  await exigirSessao();
  // Índice é preparado a partir dos artigos versionados, na geração da página.
  const documentos = criarIndiceBusca(carregarArtigos());
  return (
    <main id="conteudo" className="conteiner py-9 sm:py-12">
      <nav aria-label="Caminho de navegação" className="trilha"><Link href="/">Início</Link><span aria-hidden="true">/</span><span>Busca</span></nav>
      <div className="mb-8">
        <p className="sobre-titulo">Encontre a orientação certa</p>
        <h1 className="titulo-pagina mt-2">Pesquisar na base</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">Consulte os artigos de todas as categorias, incluindo códigos de erro, sintomas e soluções passo a passo.</p>
      </div>
      <Suspense fallback={<div className="cartao p-6" role="status">Preparando pesquisa…</div>}>
        <PainelBusca documentos={documentos} />
      </Suspense>
    </main>
  );
}
