import Link from "next/link";
import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { listarRegistrosArtigos } from "../../../lib/artigos-banco";
import { AlertaAdmin } from "../../../components/alerta-admin";
import { IconeInterface } from "../../../components/icone-interface";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Artigos({searchParams}:Props) {
  await exigirPapel(["administrador","editor"]);
  const artigos=await listarRegistrosArtigos();
  const {aviso}=await searchParams;
  return <section className="space-y-6">
    <AlertaAdmin codigo={aviso}/>
    <div className="cabecalho-pagina"><div><p className="sobre-titulo">Conteúdo editorial</p><h2 className="titulo-secao">Gerenciar artigos</h2><p className="mt-2 text-sm text-[var(--muted)]">{artigos.length} registro(s) no Neon, incluindo arquivados.</p></div><Link className="botao-primario" href="/admin/artigos/novo">+ Novo artigo</Link></div>
    <div className="grid gap-3">{artigos.length===0?<div className="cartao p-7"><IconeInterface nome="livro" className="mb-3 text-[var(--primary)]"/><p className="font-semibold">Nenhum artigo editável ainda</p><p className="mt-2 text-sm text-[var(--muted)]">Os Markdown históricos permanecem disponíveis para consulta.</p></div>:artigos.map(a=><article className="cartao flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center" key={a.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="etiqueta">{a.arquivado?"Arquivado":a.status}</span><span className="text-xs text-[var(--muted)]">Versão {a.versao}</span></div><h3 className="mt-2 text-base font-bold">{a.titulo}</h3><p className="mt-1 break-all text-xs text-[var(--muted)]">{a.categoria}/{a.slug}</p></div><Link href={`/admin/artigos/${a.id}`} className="botao-secundario shrink-0">{a.arquivado?"Ver histórico":"Editar artigo"} <IconeInterface nome="seta" width={16} height={16}/></Link></article>)}</div>
    <p className="text-xs leading-6 text-[var(--muted)]">Os artigos antigos em arquivos Markdown continuam na biblioteca, mas sua edição permanece disponível apenas no código-fonte.</p>
  </section>;
}
