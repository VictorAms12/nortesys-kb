import type { z } from "zod";
import type { artigoFrontmatterSchema } from "../lib/schema-artigo";

/** Frontmatter após a validação feita pelo Zod. */
export type FrontmatterArtigo = z.infer<typeof artigoFrontmatterSchema>;

/** Títulos oficiais e a ordem obrigatória no corpo de cada artigo. */
export const SECOES_ARTIGO = [
  "Problema",
  "Sintomas e mensagem exata",
  "Causa provável",
  "Solução passo a passo",
  "Como confirmar que resolveu",
  "Se não resolver: quando e para quem escalar",
  "Artigos relacionados",
] as const;

export type NomeSecao = (typeof SECOES_ARTIGO)[number];

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
