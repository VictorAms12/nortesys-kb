import type { Artigo } from "../types/artigo";

export function artigoPrecisaRevisao(artigo: Pick<Artigo, "revisarAte">, hoje: string): boolean {
  return Boolean(artigo.revisarAte && artigo.revisarAte < hoje);
}

/** Data de calendário da equipe (Tocantins), sem adiantar vencimentos por UTC. */
export function hojeISO(data: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Araguaina", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(data);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find(parte => parte.type === tipo)?.value ?? "";
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export type ResumoArtigo = Pick<
  Artigo,
  "tipo" | "url" | "titulo" | "resumo" | "categoria" | "nivel" | "status" | "sistema" | "tags" | "atualizadoEm" | "revisarAte" | "codigosErro"
>;

export function resumoArtigo(artigo: Artigo): ResumoArtigo {
  return {
    tipo: artigo.tipo,
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
