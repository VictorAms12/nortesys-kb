import Link from "next/link";
import {exigirPapel} from "../../../lib/autenticacao-servidor";
import {consultar} from "../../../lib/banco";
import {carregarTodosArtigos} from "../../../lib/artigos-banco";
import {artigoPrecisaRevisao,hojeISO} from "../../../lib/apresentacao";

export const dynamic="force-dynamic";
type Acesso={artigo_url:string;leitores:number};
type Feedback={artigo_url:string;sim:number;nao:number};
type Busca={termo:string;total:number};
function titulo(mapa:Map<string,string>,url:string){return mapa.get(url)??url;}
export default async function Indicadores(){
 await exigirPapel(["administrador"]);
 const [artigos,acessos,feedback,lacunas,resumo]=await Promise.all([
  carregarTodosArtigos("administrador"),
  consultar<Acesso>(`SELECT artigo_url,COUNT(*)::int AS leitores FROM kb_leituras
    WHERE acessado_em>=NOW()-INTERVAL '30 days' GROUP BY artigo_url
    ORDER BY leitores DESC,artigo_url ASC LIMIT 10`),
  consultar<Feedback>(`SELECT artigo_url,COUNT(*) FILTER(WHERE resolveu)::int AS sim,
    COUNT(*) FILTER(WHERE NOT resolveu)::int AS nao FROM kb_artigo_feedback
    GROUP BY artigo_url ORDER BY COUNT(*) FILTER(WHERE NOT resolveu) DESC,artigo_url LIMIT 10`),
  consultar<Busca>(`SELECT termo,SUM(quantidade)::int AS total FROM kb_buscas_sem_resultado
    WHERE dia>=CURRENT_DATE-29 GROUP BY termo ORDER BY total DESC,termo LIMIT 10`),
  consultar<{leitores:number;avaliacoes:number;resolvidos:number;lacunas:number;atividade:number}>(`SELECT
   (SELECT COUNT(DISTINCT usuario_id)::int FROM kb_leituras WHERE acessado_em>=NOW()-INTERVAL '30 days') AS leitores,
   (SELECT COUNT(*)::int FROM kb_artigo_feedback) AS avaliacoes,
   (SELECT COUNT(*)::int FROM kb_artigo_feedback WHERE resolveu) AS resolvidos,
   (SELECT COALESCE(SUM(quantidade),0)::int FROM kb_buscas_sem_resultado WHERE dia>=CURRENT_DATE-29) AS lacunas,
   (SELECT COUNT(*)::int FROM kb_auditoria WHERE evento IN ('artigo_criado','artigo_editado')
     AND data>=NOW()-INTERVAL '30 days') AS atividade`)
 ]);
 const artigosVisiveis=new Map(artigos.map(a=>[a.url,a.titulo]));
 const vencidos=artigos.filter(a=>a.status==="obsoleto"||artigoPrecisaRevisao(a,hojeISO())).slice(0,12);
 const k=resumo[0]??{leitores:0,avaliacoes:0,resolvidos:0,lacunas:0,atividade:0};
 const percentual=k.avaliacoes?Math.round(100*k.resolvidos/k.avaliacoes):null;
 return <div className="space-y-6">
  <div><p className="sobre-titulo">Fase 7J</p><h2 className="titulo-secao">Indicadores da base de conhecimento</h2>
   <p className="mt-2 text-sm text-[var(--muted)]">Indicadores agregados, sem expor quais colaboradores responderam ou pesquisaram. Acessos e pesquisas: últimos 30 dias; avaliações: histórico acumulado.</p></div>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   {[["Leitores com acesso recente",k.leitores],["Artigos criados/editados (30 dias)",k.atividade],
     ["Feedbacks registrados",k.avaliacoes],["Respostas positivas",percentual===null?"—":percentual+"%"],
     ["Pesquisas sem resultado (30 dias)",k.lacunas],["Artigos vencidos/obsoletos",vencidos.length]].map(([rotulo,valor])=>
     <div className="cartao p-5" key={rotulo}><strong className="block text-2xl tabular-nums">{valor}</strong>
     <span className="text-sm text-[var(--muted)]">{rotulo}</span></div>)}
  </div>
  <div className="grid gap-5 xl:grid-cols-2">
   <section className="cartao p-5"><h3 className="text-lg font-bold">Artigos com mais leitores distintos</h3>
    <p className="mt-1 text-xs text-[var(--muted)]">Contas com leitura registrada nos últimos 30 dias; não representa o total de visualizações.</p>
    {acessos.length?<ol className="mt-4 space-y-3">{acessos.map(x=><li key={x.artigo_url} className="flex justify-between gap-3 text-sm">
     <Link className="min-w-0 break-words underline" href={x.artigo_url}>{titulo(artigosVisiveis,x.artigo_url)}</Link>
     <strong className="shrink-0 tabular-nums">{x.leitores}</strong></li>)}</ol>:
    <p className="mt-4 text-sm text-[var(--muted)]">Sem leituras registradas.</p>}
   </section>
   <section className="cartao p-5"><h3 className="text-lg font-bold">Artigos que precisam de atenção</h3>
    <p className="mt-1 text-xs text-[var(--muted)]">Avaliações “não resolveu”, sem identificar quem respondeu.</p>
    {feedback.length?<ul className="mt-4 space-y-3">{feedback.map(x=><li key={x.artigo_url} className="text-sm">
     <Link className="break-words underline" href={x.artigo_url}>{titulo(artigosVisiveis,x.artigo_url)}</Link>
     <p className="mt-1 text-xs text-[var(--muted)]">{x.sim} sim · {x.nao} não</p></li>)}</ul>:
    <p className="mt-4 text-sm text-[var(--muted)]">Ainda não há avaliações.</p>}
   </section>
   <section className="cartao p-5"><h3 className="text-lg font-bold">Lacunas da pesquisa</h3>
    <p className="mt-1 text-xs text-[var(--muted)]">Consultas explícitas sem resultados. Termos com possível dado pessoal são descartados.</p>
    {lacunas.length?<ol className="mt-4 space-y-3">{lacunas.map(x=><li key={x.termo} className="flex justify-between gap-3 text-sm">
     <span className="break-words">{x.termo}</span><strong className="shrink-0 tabular-nums">{x.total}</strong></li>)}</ol>:
    <p className="mt-4 text-sm text-[var(--muted)]">Nenhuma lacuna registrada.</p>}
   </section>
   <section className="cartao p-5"><h3 className="text-lg font-bold">Revisões pendentes</h3>
    <p className="mt-1 text-xs text-[var(--muted)]">Artigos obsoletos ou com prazo de revisão vencido.</p>
    {vencidos.length?<ul className="mt-4 space-y-3">{vencidos.map(x=><li key={x.url} className="text-sm">
     <Link href={x.url} className="break-words underline">{x.titulo}</Link></li>)}</ul>:
    <p className="mt-4 text-sm text-[var(--muted)]">Nenhuma revisão pendente na amostra.</p>}
   </section>
  </div>
  <p className="text-xs text-[var(--muted)]">O painel usa apenas dados já disponíveis ou agregados; não registra corpo de conversas, senhas, IPs ou respostas individuais.</p>
 </div>;
}
