import Link from "next/link";
import { encontrarCategoria } from "../../config/categorias";
import { artigoPrecisaRevisao, formatarData, type ResumoArtigo } from "../lib/apresentacao";
import { TIPOS_CONTEUDO } from "../lib/tipos-conteudo";

export function CartaoArtigo({ artigo, hoje }: { artigo: ResumoArtigo; hoje: string }) {
 const categoria=encontrarCategoria(artigo.categoria);
 return <article className="linha-artigo">
  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
   <h3 className="min-w-0 text-sm font-semibold"><Link href={artigo.url} className="link-cartao">{artigo.titulo}</Link></h3>
   <time dateTime={artigo.atualizadoEm} className="text-xs text-[var(--muted)]">{formatarData(artigo.atualizadoEm)}</time>
  </div>
  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{artigo.resumo}</p>
  <div className="metadados-linha mt-1.5">
   <span>{categoria?.nome??artigo.categoria}</span><span aria-hidden="true">·</span>
   <span>{artigo.sistema}</span><span aria-hidden="true">·</span><span>{artigo.nivel}</span>
   <span aria-hidden="true">·</span><span>{TIPOS_CONTEUDO[artigo.tipo].nome}</span>
   {artigoPrecisaRevisao(artigo,hoje)&&<span className="texto-aviso">· Revisão vencida</span>}
  </div>
 </article>;
}
