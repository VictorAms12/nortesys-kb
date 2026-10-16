import type { CSSProperties } from "react";
import Link from "next/link";
import { exigirSessao } from "../lib/autenticacao-servidor";
import { contarPorCategoria } from "../lib/artigos";
import { carregarTodosArtigos } from "../lib/artigos-banco";
import { artigoPrecisaRevisao, hojeISO, resumoArtigo } from "../lib/apresentacao";
import { CartaoArtigo } from "../components/cartao-artigo";
import { IconeInterface } from "../components/icone-interface";

export default async function Home() {
  const sessao=await exigirSessao();
  const artigos=await carregarTodosArtigos(sessao.papel);
  const categorias=contarPorCategoria(artigos);
  const hoje=hojeISO();
  const revisao=artigos.filter(a=>artigoPrecisaRevisao(a,hoje)||a.status==="obsoleto");
  const recentes=[...artigos].sort((a,b)=>b.atualizadoEm.localeCompare(a.atualizadoEm)).slice(0,4);
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <section className="hero-inicio">
      <div className="max-w-3xl"><p className="destaque-hero">Sua central de suporte</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Conhecimento técnico, sempre ao alcance.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">Encontre procedimentos, identifique códigos de erro e compartilhe soluções com segurança.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/busca" className="botao-hero">Pesquisar soluções <span aria-hidden="true">↗</span></Link><Link href="/artigos" className="botao-hero-contorno">Explorar artigos</Link></div>
      </div>
    </section>
    <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Visão geral da base">
      <div className="cartao indicador-home"><span className="icone-indicador"><IconeInterface nome="livro"/></span><div><strong>{artigos.length}</strong><p>Artigos disponíveis</p></div></div>
      <div className="cartao indicador-home"><span className="icone-indicador"><IconeInterface nome="categorias"/></span><div><strong>{categorias.length}</strong><p>Áreas de conhecimento</p></div></div>
      <div className="cartao indicador-home"><span className="icone-indicador"><IconeInterface nome="relogio"/></span><div><strong>{revisao.length}</strong><p>Precisam de atenção</p></div></div>
    </section>
    <section className="mt-12" aria-labelledby="titulo-categorias" id="categorias"><div className="cabecalho-secao"><div><p className="sobre-titulo">Navegue por assunto</p><h2 id="titulo-categorias" className="titulo-secao">Categorias</h2></div><Link href="/categorias" className="link-discreto">Todas as categorias <IconeInterface nome="seta" width={16} height={16}/></Link></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{categorias.map(c=><Link key={c.slug} href={`/categorias/${c.slug}`} className="cartao cartao-categoria grupo-cartao p-5 no-underline"><div className="flex items-center justify-between gap-3"><span className="icone-categoria" style={{"--cor-categoria":c.cor} as CSSProperties}>{c.icone}</span><span className="etiqueta">{c.quantidade}</span></div><h3 className="mt-4 font-bold text-[var(--text)]">{c.nome} ↗</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{c.descricao}</p></Link>)}</div>
    </section>
    <section className="mt-12" aria-labelledby="titulo-recentes"><div className="cabecalho-secao"><div><p className="sobre-titulo">Continue aprendendo</p><h2 id="titulo-recentes" className="titulo-secao">Atualizados recentemente</h2></div><Link href="/artigos" className="link-discreto">Ver biblioteca <IconeInterface nome="seta" width={16} height={16}/></Link></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{recentes.length?recentes.map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>):<div className="mensagem-vazia">Ainda não há artigos disponíveis.</div>}</div></section>
    {revisao.length>0&&<section className="mt-12" aria-labelledby="titulo-revisao"><p className="sobre-titulo">Qualidade e segurança</p><h2 id="titulo-revisao" className="titulo-secao">Precisam de revisão</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Confirme orientações vencidas ou obsoletas antes de aplicá-las.</p><div className="mt-5 grid gap-4 lg:grid-cols-2">{revisao.slice(0,4).map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>)}</div></section>}
  </main>;
}
