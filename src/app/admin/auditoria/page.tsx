import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { consultar } from "../../../lib/banco";

type Evento = { id: number; evento: string; alvo: string; data: string; usuario: string | null };
export default async function Auditoria(){
  await exigirPapel(["administrador"]);
  const eventos=await consultar<Evento>(`SELECT a.id, a.evento, a.alvo, a.data::text AS data,
    u.usuario FROM kb_auditoria a LEFT JOIN kb_usuarios u ON u.id=a.usuario_id
    ORDER BY a.data DESC LIMIT 100`);
  return <section><h2 className="titulo-secao mb-4">Registro de ações administrativas</h2>
    <p className="mb-5 text-sm text-[var(--muted)]">Últimas 100 ações; eventos administrativos não incluem credenciais.</p>
    <div className="grid gap-3">{eventos.length===0?<p className="cartao p-5">Ainda não há eventos registrados.</p>:eventos.map(e=><div className="cartao grid gap-1 p-4 text-sm sm:grid-cols-3" key={e.id}>
    <strong>{e.evento.replaceAll("_"," ")}</strong><span>{e.usuario??"Conta indisponível"} · {e.alvo}</span><time className="text-[var(--muted)]">{new Date(e.data).toLocaleString("pt-BR")}</time>
    </div>)}</div>
  </section>;
}
