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
import { feedbackUsuario } from "../../../../lib/feedback-artigo";
import { migracao009Aplicada } from "../../../../lib/migracao-009";
import { FeedbackArtigo } from "../../../../components/feedback-artigo";
import { SumarioArtigo } from "../../../../components/sumario-artigo";
import { InteracoesArtigo } from "../../../../components/interacoes-artigo";
import { listarAnexosPorChave } from "../../../../lib/anexos";
import { sugerirArtigosRelacionados } from "../../../../lib/artigos-relacionados";

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
  const relacionados = sugerirArtigosRelacionados(artigo, await carregarTodosArtigos(sessao.papel));
  const [favorito, anexos, feedbackDisponivel] = await Promise.all([favoritoAtivo(sessao.id,artigo.url), listarAnexosPorChave(artigo.categoria,artigo.slug), migracao009Aplicada()]);
  const feedback = feedbackDisponivel ? await feedbackUsuario(sessao.id,artigo.url) : null;
  const revisaoVencida = artigoPrecisaRevisao(artigo, hojeISO());
  const passos = artigo.tipo === "solucao" ? extrairPassos(artigo.secoes[3]?.conteudo ?? "") : artigo.tipo === "tutorial" ? extrairPassos(artigo.secoes[2]?.conteudo ?? "") : "";
  return <main id="conteudo" className="conteiner pagina-artigo py-8">
   <nav aria-label="Caminho de navegação" className="trilha no-print">
    <Link href="/">Início</Link><span aria-hidden="true">/</span>
    <Link href={"/categorias/"+artigo.categoria}>{categoria?.nome??artigo.categoria}</Link>
    <span aria-hidden="true">/</span><span aria-current="page" className="truncate max-w-72">{artigo.titulo}</span>
   </nav>
   <header className="cabecalho-artigo">
    <h1 className="titulo-pagina">{artigo.titulo}</h1>
    <p className="resumo-artigo">{artigo.resumo}</p>
    <div className="metadados-linha metadados-artigo">
     <EtiquetaStatus status={artigo.status}/>
     <span>{artigo.nivel}</span><span aria-hidden="true">·</span>
     <span>{TIPOS_CONTEUDO[artigo.tipo].nome}</span><span aria-hidden="true">·</span>
     <span>{artigo.sistema}</span><span aria-hidden="true">·</span>
     <time dateTime={artigo.atualizadoEm}>Atualizado {formatarData(artigo.atualizadoEm)}</time>
     {artigo.revisarAte&&<><span aria-hidden="true">·</span><span>Revisar até {formatarData(artigo.revisarAte)}</span></>}
    </div>
    {Boolean(artigo.codigosErro?.length)&&<div className="codigos-artigo">
      <span>Códigos de erro</span>{artigo.codigosErro?.map(c=><code key={c} className="codigo-erro">{c}</code>)}
    </div>}
    {artigo.tags.length>0&&<p className="tags-artigo">Tags: {artigo.tags.join(", ")}</p>}
   </header>
   {(revisaoVencida||artigo.status==="obsoleto"||artigo.status==="rascunho")&&
    <div className="aviso-artigo" role="alert"><strong>{artigo.status==="obsoleto"?"Artigo obsoleto":revisaoVencida?"Revisão vencida":"Artigo em rascunho"}</strong>
     <p>{artigo.status==="obsoleto"?"Não aplique este procedimento sem validação técnica.":
       revisaoVencida?"Confirme as orientações e a documentação oficial antes de aplicar.":"O procedimento ainda não passou por revisão."}</p>
    </div>}
   <div className="barra-acoes-artigo no-print"><InteracoesArtigo url={artigo.url} favoritoInicial={favorito}/><AcoesArtigo passos={passos}/></div>
   <div className="layout-artigo">
    <article className="leitura-artigo">
     {artigo.secoes.map((secao,i)=><section className="secao-artigo" id={"secao-"+(i+1)} key={secao.titulo}>
      <h2 id={"titulo-secao-"+(i+1)}>{secao.titulo}</h2>
      <ConteudoMarkdown markdown={secao.conteudo}/>
     </section>)}
     {anexos.length>0&&<section className="lista-complementar" aria-labelledby="titulo-documentos">
      <h2 id="titulo-documentos">Documentos anexos</h2>
      <ul>{anexos.map(a=><li key={a.id}>
       <div><strong>{a.nome}</strong><small>PDF · {(a.tamanho/1024/1024).toFixed(2)} MB</small></div>
       <div className="links-anexo"><a href={"/api/anexos/"+a.id+"?visualizar=1"} target="_blank" rel="noopener noreferrer">Visualizar</a>
        <a href={"/api/anexos/"+a.id}>Baixar</a></div>
      </li>)}</ul>
     </section>}
     {relacionados.length>0&&<section className="lista-complementar" aria-labelledby="titulo-relacionados">
      <h2 id="titulo-relacionados">Artigos relacionados</h2>
      <ul>{relacionados.map(a=><li key={a.url}><Link href={a.url}><strong>{a.titulo}</strong><small>{a.resumo}</small></Link></li>)}</ul>
     </section>}
     {Boolean(artigo.fonteOficial?.length)&&<section className="lista-complementar" aria-labelledby="titulo-fontes">
      <h2 id="titulo-fontes">Fontes oficiais</h2>
      <ul>{artigo.fonteOficial?.map(url=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all">{url}</a></li>)}</ul>
     </section>}
     {feedbackDisponivel&&<FeedbackArtigo url={artigo.url} inicial={feedback}/>}
    </article>
    <SumarioArtigo secoes={artigo.secoes.map(s=>s.titulo)}/>
   </div>
  </main>;
}
