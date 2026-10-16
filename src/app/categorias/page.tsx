import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirSessao } from "../../lib/autenticacao-servidor";
import { carregarTodosArtigos } from "../../lib/artigos-banco";
import { contarPorCategoria } from "../../lib/artigos";
export const metadata: Metadata = {title:"Categorias | Nortesys KB"};
export default async function PaginaCategorias(){
  const sessao=await exigirSessao();
  const categorias=contarPorCategoria(await carregarTodosArtigos(sessao.papel));
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Categorias</span></nav>
    <div className="mb-8"><p className="sobre-titulo">Explore por assunto</p><h1 className="titulo-pagina mt-2">Categorias</h1><p className="mt-3 texto-introducao">Encontre as orientações organizadas por área técnica.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categorias.map(c=><Link key={c.slug} href={`/categorias/${c.slug}`} className="cartao cartao-categoria grupo-cartao p-6 no-underline"><div className="flex items-center justify-between gap-4"><span className="icone-categoria" style={{"--cor-categoria":c.cor} as CSSProperties}>{c.icone}</span><span className="etiqueta">{c.quantidade} artigo(s)</span></div><h2 className="mt-5 text-lg font-bold text-[var(--text)]">{c.nome} <span aria-hidden="true">↗</span></h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{c.descricao}</p></Link>)}</div>
  </main>;
}
