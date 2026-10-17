import Link from "next/link";
import { encontrarCategoria } from "../../config/categorias";
import { artigoPrecisaRevisao, formatarData, type ResumoArtigo } from "../lib/apresentacao";
import { EtiquetaStatus } from "./etiqueta-status";
import { TIPOS_CONTEUDO } from "../lib/tipos-conteudo";

export function CartaoArtigo({ artigo, hoje }: { artigo: ResumoArtigo; hoje: string }) {
  const categoria = encontrarCategoria(artigo.categoria);
  return (
    <article className="cartao p-5 transition hover:border-teal-500">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="etiqueta">{categoria?.icone} {categoria?.nome}</span>
        <span className="etiqueta">{artigo.nivel}</span><span className="etiqueta">{TIPOS_CONTEUDO[artigo.tipo].nome}</span>
        <EtiquetaStatus status={artigo.status} />
        {artigoPrecisaRevisao(artigo, hoje) && <span className="etiqueta alerta-revisao">Revisão vencida</span>}
      </div>
      <h3 className="text-lg leading-snug font-bold">
        <Link className="link-cartao" href={artigo.url}>{artigo.titulo}</Link>
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{artigo.resumo}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <span>{artigo.sistema}</span><span aria-hidden="true">·</span>
        <time dateTime={artigo.atualizadoEm}>Atualizado {formatarData(artigo.atualizadoEm)}</time>
      </div>
    </article>
  );
}
