import type { CSSProperties } from "react";
import { exigirSessao } from "../lib/autenticacao-servidor";
import Link from "next/link";
import { contarPorCategoria } from "../lib/artigos";
import { carregarTodosArtigos } from "../lib/artigos-banco";
import { artigoPrecisaRevisao, hojeISO, resumoArtigo } from "../lib/apresentacao";
import { CartaoArtigo } from "../components/cartao-artigo";

export default async function Home() {
  const sessao = await exigirSessao();
  const artigos = await carregarTodosArtigos(sessao.papel);
  const categorias = contarPorCategoria(artigos);
  const hoje = hojeISO();
  const revisao = artigos.filter((a) => artigoPrecisaRevisao(a, hoje) || a.status === "obsoleto");
  const criados = [...artigos].sort((a,b) => b.criadoEm.localeCompare(a.criadoEm));
  return (
    <main id="conteudo">
      <section className="hero">
        <div className="conteiner py-14 sm:py-20">
          <span className="destaque-hero">Central de procedimentos da equipe</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">A resposta certa, no meio do atendimento.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">Orientações organizadas para os analistas de suporte da Nortesys. Consulte por categoria e siga cada passo com segurança.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#categorias" className="botao-hero">Explorar categorias ↓</a>
            <Link href="/busca" className="rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-white/10">🔎 Pesquisar procedimentos →</Link>
          </div>
        </div>
      </section>
      <div className="conteiner py-11 sm:py-14">
        <section id="categorias" className="scroll-mt-24" aria-labelledby="titulo-categorias">
          <div className="cabecalho-secao"><div><p className="sobre-titulo">Explore por assunto</p><h2 id="titulo-categorias" className="titulo-secao">Categorias</h2></div><span className="text-sm text-[var(--muted)]">{artigos.length} artigo(s) · {categorias.length} áreas</span></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => <Link key={c.slug} href={`/categorias/${c.slug}`} className="cartao cartao-categoria group p-5 no-underline">
              <div className="flex items-center justify-between gap-3"><span className="icone-categoria" style={{ "--cor-categoria": c.cor } as CSSProperties} aria-hidden="true">{c.icone}</span><span className="etiqueta">{c.quantidade} artigo(s)</span></div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text)] group-hover:text-teal-700">{c.nome} <span aria-hidden="true">↗</span></h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{c.descricao}</p>
            </Link>)}
          </div>
        </section>
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="titulo-recentes">
            <div className="cabecalho-secao"><div><p className="sobre-titulo">Novos procedimentos</p><h2 id="titulo-recentes" className="titulo-secao">Mais recentes</h2></div></div>
            <div className="mt-5 grid gap-3">{criados.length ? criados.slice(0,3).map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>) : <p className="mensagem-vazia">Ainda não há artigos cadastrados.</p>}</div>
          </section>
          <section aria-labelledby="titulo-atualizados">
            <div className="cabecalho-secao"><div><p className="sobre-titulo">Últimas alterações</p><h2 id="titulo-atualizados" className="titulo-secao">Atualizados recentemente</h2></div></div>
            <div className="mt-5 grid gap-3">{artigos.length ? artigos.slice(0,3).map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>) : <p className="mensagem-vazia">Ainda não há atualizações.</p>}</div>
          </section>
        </div>
        <section className="mt-14" aria-labelledby="titulo-revisao">
          <div className="cabecalho-secao"><div><p className="sobre-titulo">Qualidade do conteúdo</p><h2 id="titulo-revisao" className="titulo-secao">Precisam de revisão</h2></div></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Artigos cujo prazo de revisão passou ou foram marcados como obsoletos. A lista é atualizada a cada nova publicação do site.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{revisao.length ? revisao.map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>) : <div className="cartao p-6 text-sm text-[var(--muted)]">Nenhum artigo está marcado como vencido ou obsoleto. ✓</div>}</div>
        </section>
      </div>
    </main>
  );
}
