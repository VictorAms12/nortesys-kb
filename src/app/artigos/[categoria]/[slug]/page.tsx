import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirSessao } from "../../../../lib/autenticacao-servidor";
import { encontrarCategoria } from "../../../../../config/categorias";
import { AcoesArtigo } from "../../../../components/acoes-artigo";
import { ConteudoMarkdown } from "../../../../components/conteudo-markdown";
import { EtiquetaStatus } from "../../../../components/etiqueta-status";
import { carregarTodosArtigos } from "../../../../lib/artigos-banco";
import { artigoPrecisaRevisao, formatarData, hojeISO } from "../../../../lib/apresentacao";
import { extrairPassos } from "../../../../lib/markdown";
import { TIPOS_CONTEUDO } from "../../../../lib/tipos-conteudo";
import { favoritoAtivo } from "../../../../lib/interacoes";
import { InteracoesArtigo } from "../../../../components/interacoes-artigo";
import { listarAnexosPorChave } from "../../../../lib/anexos";

type Props = { params: Promise<{ categoria: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sessao = await exigirSessao();
  const { categoria, slug } = await params;
  const artigo = (await carregarTodosArtigos(sessao.papel)).find((a) => a.categoria === categoria && a.slug === slug);
  return { title: artigo ? `${artigo.titulo} | Nortesys KB` : "Artigo não encontrado", description: artigo?.resumo };
}

export default async function PaginaArtigo({ params }: Props) {
  const sessao = await exigirSessao();
  const { categoria: slugCategoria, slug } = await params;
  const artigo = (await carregarTodosArtigos(sessao.papel)).find((a) => a.categoria === slugCategoria && a.slug === slug);
  if (!artigo) notFound();
  const categoria = encontrarCategoria(artigo.categoria);
  const [favorito, anexos] = await Promise.all([favoritoAtivo(sessao.id,artigo.url), listarAnexosPorChave(artigo.categoria,artigo.slug)]);
  const revisaoVencida = artigoPrecisaRevisao(artigo, hojeISO());
  const passos = artigo.tipo === "solucao" ? extrairPassos(artigo.secoes[3]?.conteudo ?? "") : artigo.tipo === "tutorial" ? extrairPassos(artigo.secoes[2]?.conteudo ?? "") : "";
  return (
    <main id="conteudo" className="conteiner py-8 sm:py-11">
      <nav aria-label="Caminho de navegação" className="trilha no-print">
        <Link href="/">Início</Link><span aria-hidden="true">/</span>
        <Link href={`/categorias/${artigo.categoria}`}>{categoria?.nome ?? artigo.categoria}</Link><span aria-hidden="true">/</span>
        <span aria-current="page" className="max-w-52 truncate">{artigo.titulo}</span>
      </nav>
      <div className="mb-8 max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="etiqueta">{categoria?.icone} {categoria?.nome}</span>
          <span className="etiqueta">{artigo.nivel}</span><span className="etiqueta">{TIPOS_CONTEUDO[artigo.tipo].nome}</span><EtiquetaStatus status={artigo.status} />
        </div>
        <h1 className="titulo-pagina max-w-4xl">{artigo.titulo}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[var(--muted)]">{artigo.resumo}</p>
        {Boolean(artigo.codigosErro?.length) && <div className="mt-5 flex flex-wrap items-center gap-2 text-sm"><strong>Códigos de erro:</strong>{artigo.codigosErro?.map(c=><code className="etiqueta" key={c}>{c}</code>)}</div>}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
          <span>Atualizado <time dateTime={artigo.atualizadoEm}>{formatarData(artigo.atualizadoEm)}</time></span>
          <span>Autor: {artigo.autor}</span><span>Sistema: {artigo.sistema}</span>
        </div>
        {artigo.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{artigo.tags.map(t=><span key={t} className="etiqueta">#{t}</span>)}</div>}
      </div>
      {(revisaoVencida || artigo.status === "obsoleto" || artigo.status === "rascunho") &&
        <div className="aviso-artigo mb-7" role="alert">
          <strong>{artigo.status === "obsoleto" ? "Artigo obsoleto" : revisaoVencida ? "Prazo de revisão vencido" : "Conteúdo em rascunho"}</strong>
          <p className="mt-1">{artigo.status === "obsoleto" ? "Este procedimento não deve ser aplicado sem validação técnica." : revisaoVencida ? `Revisão prevista até ${formatarData(artigo.revisarAte!)}. Confirme as orientações com a equipe responsável e a fonte oficial vigente.` : "Este artigo ainda não foi revisado pela equipe. Confirme o procedimento antes de aplicá-lo."}</p>
        </div>
      }
      <div className="mb-4"><InteracoesArtigo url={artigo.url} favoritoInicial={favorito}/></div>
      <AcoesArtigo passos={passos} />
      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0">
          {artigo.secoes.map((secao, indice) => (
            <section className="secao-artigo scroll-mt-28" id={`secao-${indice + 1}`} key={secao.titulo} aria-labelledby={`titulo-secao-${indice+1}`}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="num-secao" aria-hidden="true">{String(indice + 1).padStart(2,"0")}</span>
                <h2 id={`titulo-secao-${indice+1}`} className="text-xl font-bold tracking-tight sm:text-2xl">{secao.titulo}</h2>
              </div>
              <ConteudoMarkdown markdown={secao.conteudo} />
            </section>
          ))}
          {anexos.length>0 && <section className="mt-8 rounded-xl border border-[var(--border)] p-5" aria-labelledby="titulo-documentos">
            <h2 id="titulo-documentos" className="mb-3 text-lg font-bold">Documentos anexos</h2>
            <ul className="grid gap-2">{anexos.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
              <div className="min-w-0"><p className="break-all text-sm font-semibold">{a.nome}</p>
                <p className="text-xs text-[var(--muted)]">PDF · {(a.tamanho/1024/1024).toFixed(2)} MB</p></div>
              <a href={`/api/anexos/${a.id}`} className="botao-secundario shrink-0">Baixar PDF</a>
            </li>)}</ul>
          </section>}
          {Boolean(artigo.fonteOficial?.length) && <section className="mt-8 rounded-xl border border-[var(--border)] p-5">
            <h2 className="mb-2 text-lg font-bold">Fontes oficiais para conferência</h2>
            <ul className="list-inside list-disc space-y-2 break-all text-sm">{artigo.fonteOficial?.map((url)=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>)}</ul>
          </section>}
        </div>
        <aside className="sumario-lateral no-print xl:sticky xl:top-24" aria-label="Sumário do artigo">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Neste artigo</h2>
          <nav><ol className="space-y-1">{artigo.secoes.map((s, i)=><li key={s.titulo}>
            <a className="link-sumario" href={`#secao-${i+1}`}><span className="mr-2 text-[var(--muted)]">{i+1}.</span>{s.titulo}</a>
          </li>)}</ol></nav>
          {artigo.revisarAte && <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">Revisar até {formatarData(artigo.revisarAte)}</p>}
        </aside>
      </div>
    </main>
  );
}
