import { remark } from "remark";
import { encontrarCategoria } from "../../config/categorias";
import { resumoArtigo, type ResumoArtigo } from "./apresentacao";
import type { Artigo } from "../types/artigo";

export type DocumentoBusca = ResumoArtigo & {
  nomeCategoria: string;
  /** Texto simples, sem marcação HTML ou Markdown, para pesquisar em todas as seções. */
  conteudoBusca: string;
};

type NoMarkdown = {
  type?: string;
  value?: unknown;
  alt?: unknown;
  children?: unknown;
};

function extrairTexto(no: NoMarkdown): string {
  // O parser do remark evita confundir a sintaxe Markdown com o texto real.
  if (typeof no.value === "string") return no.value;
  if (no.type === "image" && typeof no.alt === "string") return no.alt;
  if (!Array.isArray(no.children)) return "";
  return no.children.map((filho) => extrairTexto(filho as NoMarkdown)).join(" ");
}

export function criarIndiceBusca(artigos: Artigo[]): DocumentoBusca[] {
  return artigos.map((artigo) => ({
    ...resumoArtigo(artigo),
    nomeCategoria: encontrarCategoria(artigo.categoria)?.nome ?? artigo.categoria,
    conteudoBusca: extrairTexto(remark().parse(artigo.markdown)).replace(/\s+/g, " ").trim(),
  }));
}
