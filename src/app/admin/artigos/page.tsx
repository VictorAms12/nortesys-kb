import Link from "next/link";
import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { listarRegistrosArtigos } from "../../../lib/artigos-banco";
import { AlertaAdmin } from "../../../components/alerta-admin";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Artigos({searchParams}:Props) {
  await exigirPapel(["administrador","editor"]);
  const artigos=await listarRegistrosArtigos();const {aviso}=await searchParams;
  return <section><AlertaAdmin codigo={aviso}/><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="titulo-secao">Artigos gerenciáveis ({artigos.length})</h2><Link className="botao-primario" href="/admin/artigos/novo">Novo artigo +</Link></div>
    <div className="grid gap-3">{artigos.length===0&&<div className="cartao p-6">Ainda não há artigos no banco. Os Markdown antigos permanecem disponíveis para consulta.</div>}
    {artigos.map(a=><article className="cartao flex flex-wrap items-center justify-between gap-3 p-5" key={a.id}><div><h3 className="font-bold">{a.titulo}</h3><p className="mt-1 text-sm text-[var(--muted)]">{a.categoria}/{a.slug} · v{a.versao} · {a.arquivado?"Arquivado":a.status}</p></div><Link href={`/admin/artigos/${a.id}`} className="botao-secundario">{a.arquivado?"Histórico":"Editar"}</Link></article>)}
    </div><p className="mt-4 text-sm text-[var(--muted)]">Artigos antigos em arquivos Markdown são exibidos normalmente na base, mas não podem ser editados pelo painel nesta fase.</p>
  </section>;
}
