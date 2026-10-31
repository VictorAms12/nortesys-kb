import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { exigirSessao } from "../../lib/autenticacao-servidor";
import { carregarTodosArtigos } from "../../lib/artigos-banco";
import { criarIndiceBusca } from "../../lib/indice-busca";
import { PainelBusca } from "../../components/painel-busca";

export const metadata: Metadata = {
  title: "Buscar artigos | Nortesys KB",
  description: "Pesquise soluções, tutoriais, guias, FAQ e códigos de erro na base de conhecimento.",
};

export default async function PaginaBusca() {
  const sessao = await exigirSessao();
  // Inclui arquivos Markdown e os artigos persistidos no Neon.
  const documentos = criarIndiceBusca(await carregarTodosArtigos(sessao.papel));
  return (
    <main id="conteudo" className="conteiner py-9 sm:py-12">
      <nav aria-label="Caminho de navegação" className="trilha"><Link href="/">Início</Link><span aria-hidden="true">/</span><span>Busca</span></nav>
      <div className="mb-8">
        
        <h1 className="titulo-pagina">Pesquisar na base</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">Busque procedimentos, rejeições fiscais, códigos de erro e configurações.</p>
      </div>
      <Suspense fallback={<div className="estado-vazio" role="status">Preparando pesquisa…</div>}>
        <PainelBusca documentos={documentos} />
      </Suspense>
    </main>
  );
}
