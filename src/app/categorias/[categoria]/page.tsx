import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "../../../lib/autenticacao-servidor";
import { encontrarCategoria } from "../../../../config/categorias";
import { IconeInterface,type NomeIcone } from "../../../components/icone-interface";
import { FiltrosCategoria } from "../../../components/filtros-categoria";
import { carregarTodosArtigos } from "../../../lib/artigos-banco";
import { hojeISO, resumoArtigo } from "../../../lib/apresentacao";

type Props = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await exigirSessao();
  const { categoria: slug } = await params;
  const categoria = encontrarCategoria(slug);
  return { title: categoria ? `${categoria.nome} | Nortesys KB` : "Categoria não encontrada", description: categoria?.descricao };
}

export default async function PaginaCategoria({ params }: Props) {
  const sessao = await exigirSessao();
  const { categoria: slug } = await params;
  const categoria = encontrarCategoria(slug);
  if (!categoria) notFound();
  const artigos = (await carregarTodosArtigos(sessao.papel)).filter((a) => a.categoria === slug).map(resumoArtigo);
  return (
    <main id="conteudo" className="conteiner py-9 sm:py-12">
      <nav aria-label="Caminho de navegação" className="trilha"><Link href="/">Início</Link><span aria-hidden="true">/</span><span>{categoria.nome}</span></nav>
      <div className="mb-7 flex items-center gap-3">
        <span className="icone-categoria" aria-hidden="true"><IconeInterface nome={categoria.icone as NomeIcone}/></span>
        <div><h1 className="titulo-pagina">{categoria.nome}</h1><p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">{categoria.descricao}</p></div>
      </div>
      <FiltrosCategoria artigos={artigos} hoje={hojeISO()} />
    </main>
  );
}
