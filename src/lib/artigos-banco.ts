import "server-only";
import { cache } from "react";
import { consultar } from "./banco";
import { carregarArtigos } from "./artigos";
import { combinarArtigos } from "./artigos-visibilidade";
import type { Artigo } from "../types/artigo";
import type { Papel } from "./usuarios";

export type RegistroArtigo = {
  id: string; categoria: string; slug: string; titulo: string;
  status: "rascunho" | "revisado" | "obsoleto";
  conteudo: string; versao: number; arquivado: boolean;
};
export type VersaoArtigo = {
  versao: number; acao: string; conteudo: string; editor: string | null; data: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function idArtigoValido(id: string): boolean { return uuid.test(id); }

/** Versões editáveis ficam no banco; arquivos Markdown históricos continuam funcionando. */
export async function listarRegistrosArtigos(): Promise<RegistroArtigo[]> {
  return consultar<RegistroArtigo>(`SELECT id, categoria, slug, titulo, status, conteudo, versao, arquivado
    FROM kb_artigos ORDER BY atualizado_em DESC`);
}
export async function obterRegistroArtigo(id: string): Promise<RegistroArtigo | null> {
  if (!idArtigoValido(id)) return null;
  const rows = await consultar<RegistroArtigo>(`SELECT id, categoria, slug, titulo, status, conteudo, versao, arquivado
    FROM kb_artigos WHERE id=$1 LIMIT 1`, [id]);
  return rows[0] ?? null;
}
export async function listarVersoesArtigo(id: string): Promise<VersaoArtigo[]> {
  if (!idArtigoValido(id)) return [];
  return consultar<VersaoArtigo>(`SELECT v.versao, v.acao, v.conteudo, u.nome AS editor, v.data::text AS data
    FROM kb_artigo_versoes v LEFT JOIN kb_usuarios u ON u.id=v.editor_id
    WHERE v.artigo_id=$1 ORDER BY v.versao DESC LIMIT 50`, [id]);
}
// Cache por requisição: nenhuma sessão ou publicação fica retida entre acessos.
export const carregarTodosArtigos = cache(async (papel: Papel): Promise<Artigo[]> => {
  const locais = carregarArtigos();
  const registros = await listarRegistrosArtigos();
  return combinarArtigos(locais, registros, papel);
});
