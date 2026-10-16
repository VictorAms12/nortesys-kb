import Fuse from "fuse.js";
import type { DocumentoBusca } from "./indice-busca";

export const MINIMO_CARACTERES_BUSCA = 2;

/** Um único índice Fuse por lote de artigos, reconstruído apenas quando os dados mudam. */
export function criarBuscador(documentos: DocumentoBusca[]): Fuse<DocumentoBusca> {
  return new Fuse(documentos, {
    ignoreDiacritics: true,
    ignoreLocation: true, // Encontra palavras mesmo no final de procedimentos longos.
    includeScore: true,
    threshold: 0.38,
    useTokenSearch: true,
    keys: [
      { name: "codigosErro", weight: 6 },
      { name: "titulo", weight: 5 },
      { name: "tags", weight: 3 },
      { name: "resumo", weight: 2.5 },
      { name: "sistema", weight: 2 },
      { name: "nomeCategoria", weight: 1.2 },
      { name: "conteudoBusca", weight: 0.6 },
    ],
  });
}

export type ResultadoBusca = { artigo: DocumentoBusca; pontuacao: number };

function normalizar(termo: string): string {
  return termo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

/** Prioriza código exato e títulos; nas demais situações usa a relevância do Fuse. */
export function executarBusca(buscador: Fuse<DocumentoBusca>, consulta: string): ResultadoBusca[] {
  const termo = consulta.trim().replace(/\s+/g, " ").slice(0, 120);
  if (termo.length < MINIMO_CARACTERES_BUSCA) return [];

  const termoNormalizado = normalizar(termo);
  const resultados = buscador.search(termo).map((resultado) => {
    const artigo = resultado.item;
    const codigosErro = artigo.codigosErro ?? [];
    const codigoExato = codigosErro.some((codigo) => normalizar(codigo) === termoNormalizado);
    const codigoContem = codigosErro.some((codigo) => normalizar(codigo).includes(termoNormalizado));
    const tituloContem = normalizar(artigo.titulo).includes(termoNormalizado);
    const prioridade = codigoExato ? -3 : codigoContem ? -2 : tituloContem ? -1 : 0;
    return { artigo, pontuacao: resultado.score ?? 1, prioridade };
  });

  resultados.sort((a, b) =>
    a.prioridade - b.prioridade || a.pontuacao - b.pontuacao || a.artigo.titulo.localeCompare(b.artigo.titulo, "pt-BR"),
  );
  return resultados.map(({ artigo, pontuacao }) => ({ artigo, pontuacao }));
}

/** Encontra um trecho útil do corpo sem injetar HTML na página. */
export function trechoEncontrado(conteudo: string, consulta: string, tamanho = 180): string {
  if (!conteudo) return "";
  const simplificado = normalizar(conteudo);
  const termos = normalizar(consulta).split(/\s+/).filter((termo) => termo.length >= 3);
  const inicioTermo = termos.map((termo) => simplificado.indexOf(termo)).filter((i) => i >= 0);
  const posicao = inicioTermo.length ? Math.min(...inicioTermo) : 0;
  const inicio = Math.max(0, posicao - 65);
  const fim = Math.min(conteudo.length, inicio + tamanho);
  return `${inicio ? "…" : ""}${conteudo.slice(inicio, fim).trim()}${fim < conteudo.length ? "…" : ""}`;
}
