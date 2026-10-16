import type { Artigo } from "../types/artigo";

export function artigoPrecisaRevisao(artigo: Pick<Artigo, "revisarAte">, hoje: string): boolean {
  return Boolean(artigo.revisarAte && artigo.revisarAte < hoje);
}

export function hojeISO(): string {
  // Essa função é usada apenas durante o pré-render no servidor.
  return new Date().toISOString().slice(0, 10);
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export type ResumoArtigo = Pick<
  Artigo,
  "url" | "titulo" | "resumo" | "categoria" | "nivel" | "status" | "sistema" | "tags" | "atualizadoEm" | "revisarAte" | "codigosErro"
>;

export function resumoArtigo(artigo: Artigo): ResumoArtigo {
  return {
    url: artigo.url,
    titulo: artigo.titulo,
    resumo: artigo.resumo,
    categoria: artigo.categoria,
    nivel: artigo.nivel,
    status: artigo.status,
    sistema: artigo.sistema,
    tags: artigo.tags,
    atualizadoEm: artigo.atualizadoEm,
    revisarAte: artigo.revisarAte,
    codigosErro: artigo.codigosErro,
  };
}
