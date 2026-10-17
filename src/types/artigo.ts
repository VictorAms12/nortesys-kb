import type { z } from "zod";
import type { artigoFrontmatterSchema } from "../lib/schema-artigo";
import { TIPOS_CONTEUDO } from "../lib/tipos-conteudo";

/** Frontmatter após a validação feita pelo Zod. */
export type FrontmatterArtigo = z.infer<typeof artigoFrontmatterSchema>;

/** Títulos oficiais e a ordem obrigatória no corpo de cada artigo. */
export const SECOES_ARTIGO = TIPOS_CONTEUDO.solucao.secoes;
export type NomeSecao = string;

export type SecaoArtigo = {
  titulo: NomeSecao;
  conteudo: string;
};

/** Artigo normalizado, vindo de Markdown versionado ou do PostgreSQL. */
export type Artigo = FrontmatterArtigo & {
  slug: string;
  caminho: string;
  url: string;
  markdown: string;
  secoes: SecaoArtigo[];
};
