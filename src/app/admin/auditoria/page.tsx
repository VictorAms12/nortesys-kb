import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { consultar } from "../../../lib/banco";
import { IconeInterface } from "../../../components/icone-interface";
type Props={searchParams:Promise<{evento?:string;usuario?:string}>};
type Evento = { id:number; evento:string; alvo:string; data:string; usuario:string|null };
export default async function Auditoria({searchParams}:Props){
  await exigirPapel(["administrador"]);
  const filtros=await searchParams;
  const tipos=["artigo_criado","artigo_editado","artigo_arquivado","usuario_criado","usuario_editar","usuario_senha_redefinida","usuario_desativar","usuario_ativar"];
  const evento=tipos.includes(filtros.evento??"")?filtros.evento??"":"";
  const usuario=(filtros.usuario??"").slice(0,40).trim();
  const eventos=await consultar<Evento>(`SELECT a.id, a.evento, a.alvo, a.data::text AS data,
    u.usuario FROM kb_auditoria a LEFT JOIN kb_usuarios u ON u.id=a.usuario_id
    WHERE ($1::text = '' OR a.evento = $1) AND ($2::text = '' OR u.usuario = $2)
    ORDER BY a.data DESC LIMIT 100`,[evento,usuario]);
  return <section className="space-y-5"><div className="cabecalho-secao"><div><p className="sobre-titulo">Rastreabilidade</p><h2 className="titulo-secao">Registro de ações</h2><p className="mt-2 text-sm text-[var(--muted)]">Últimas 100 ações administrativas; credenciais não são registradas.</p></div><span className="etiqueta">{eventos.length} evento(s)</span></div>
    <form method="get" className="cartao grid gap-3 p-4 sm:grid-cols-3">
      <label className="campo-filtro">Evento<select name="evento" defaultValue={evento}><option value="">Todos os eventos</option>{tipos.map(t=><option key={t} value={t}>{t.replaceAll("_"," ")}</option>)}</select></label>
      <label className="campo-filtro">Nome de usuário<input className="campo-pesquisa" name="usuario" maxLength={40} defaultValue={usuario} placeholder="ex.: joao.silva"/></label>
      <button type="submit" className="botao-secundario self-end">Filtrar registros</button>
    </form>
    <div className="grid gap-3">{eventos.length===0?<p className="cartao p-6 text-sm text-[var(--muted)]">Ainda não há eventos registrados.</p>:eventos.map(e=><article className="cartao flex flex-col gap-3 p-5 sm:flex-row sm:items-center" key={e.id}><span className="icone-indicador"><IconeInterface nome="auditoria"/></span><div className="min-w-0 flex-1"><h3 className="font-semibold capitalize">{e.evento.replaceAll("_"," ")}</h3><p className="mt-1 break-words text-sm text-[var(--muted)]">{e.usuario??"Conta indisponível"} · {e.alvo}</p></div><time dateTime={e.data} className="text-xs text-[var(--muted)]">{new Date(e.data).toLocaleString("pt-BR")}</time></article>)}</div>
  </section>;
}
