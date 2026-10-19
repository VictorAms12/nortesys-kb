import Link from "next/link";
import {exigirPapel} from "../../../lib/autenticacao-servidor";
import {consultar} from "../../../lib/banco";
import {ROTULOS_AUDITORIA} from "../../../lib/auditoria-eventos";
type Props={searchParams:Promise<{evento?:string;usuario?:string;pagina?:string;de?:string;ate?:string}>};
type Evento={id:number;evento:string;alvo:string;data:string;usuario:string|null};
export default async function Auditoria({searchParams}:Props){
 await exigirPapel(["administrador"]);
 const filtros=await searchParams;
 const evento=Object.hasOwn(ROTULOS_AUDITORIA,filtros.evento??"")?filtros.evento??"":"";
 const usuario=(filtros.usuario??"").slice(0,40).trim();
 const de=/^\d{4}-\d{2}-\d{2}$/.test(filtros.de??"")?filtros.de!:"";
 const ate=/^\d{4}-\d{2}-\d{2}$/.test(filtros.ate??"")?filtros.ate!:"";
 const p=Math.max(1,Math.min(1000,Number.parseInt(filtros.pagina??"1",10)||1));
 const queryWhere=" FROM kb_auditoria a LEFT JOIN kb_usuarios u ON u.id=a.usuario_id "+
  "WHERE ($1::text='' OR a.evento=$1) AND ($2::text='' OR u.usuario=$2) "+
  "AND ($3::date IS NULL OR a.data >= $3::date) "+
  "AND ($4::date IS NULL OR a.data < ($4::date+INTERVAL '1 day'))";
 const args=[evento,usuario,de||null,ate||null];
 const quantidade=await consultar<{total:number}>("SELECT COUNT(*)::int AS total"+queryWhere,args);
 const total=quantidade[0]?.total??0,paginas=Math.max(1,Math.ceil(total/50));
 const pagina=Math.min(p,paginas);
 const eventos=await consultar<Evento>("SELECT a.id,a.evento,a.alvo,a.data::text AS data,u.usuario "+
 queryWhere+" ORDER BY a.data DESC,a.id DESC LIMIT 50 OFFSET $5",[...args,(pagina-1)*50]);
 const url=(pag:number)=>{
  const q=new URLSearchParams();if(evento)q.set("evento",evento);if(usuario)q.set("usuario",usuario);
  if(de)q.set("de",de);if(ate)q.set("ate",ate);q.set("pagina",String(pag));
  return "/admin/auditoria?"+q.toString();
 };
 return <section className="space-y-5">
   <div className="cabecalho-pagina"><div><p className="sobre-titulo">Rastreabilidade</p>
     <h2 className="titulo-secao">Auditoria de atividades</h2>
     <p className="mt-2 text-sm text-[var(--muted)]">Operações e acessos relevantes. Sem senhas, mensagens privadas ou conteúdo dos artigos.</p>
   </div><span className="etiqueta">{total} evento(s)</span></div>
   <form method="get" className="cartao grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
    <label className="campo-filtro">Evento<select name="evento" defaultValue={evento}>
      <option value="">Todos os eventos</option>
      {Object.entries(ROTULOS_AUDITORIA).map(([chave,nome])=><option key={chave} value={chave}>{nome}</option>)}
    </select></label>
    <label className="campo-filtro">Usuário<input className="campo-pesquisa" name="usuario" defaultValue={usuario} maxLength={40} placeholder="Ex.: analista.n1"/></label>
    <label className="campo-filtro">De<input type="date" name="de" defaultValue={de}/></label>
    <label className="campo-filtro">Até<input type="date" name="ate" defaultValue={ate}/></label>
    <button type="submit" className="botao-secundario self-end">Filtrar</button>
   </form>
   <div className="grid gap-3">{eventos.length===0?
     <p className="cartao p-6 text-sm text-[var(--muted)]">Nenhuma atividade encontrada.</p>:
     eventos.map(e=><article className="cartao flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center" key={e.id}>
       <div className="min-w-0"><h3 className="font-semibold">{ROTULOS_AUDITORIA[e.evento]??e.evento.replaceAll("_"," ")}</h3>
         <p className="mt-1 break-words text-sm text-[var(--muted)]">{e.usuario??"Conta não identificada"} · {e.alvo}</p></div>
       <time dateTime={e.data} className="shrink-0 text-xs text-[var(--muted)]">{new Date(e.data).toLocaleString("pt-BR")}</time>
     </article>)}</div>
   <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
     {pagina>1?<Link className="botao-secundario" href={url(pagina-1)}>← Anterior</Link>:<span/>}
     <span className="text-xs text-[var(--muted)]">Página {pagina} de {paginas}</span>
     {pagina<paginas?<Link className="botao-secundario" href={url(pagina+1)}>Próxima →</Link>:<span/>}
   </nav>
 </section>;
}
