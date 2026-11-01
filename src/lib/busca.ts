import Fuse from "fuse.js";
import type { DocumentoBusca } from "./indice-busca";
import { normalizarTexto, prepararConsulta, normalizarCodigoErro } from "./busca-normalizacao";

export const MINIMO_CARACTERES_BUSCA = 2;

/** Um único índice Fuse por lote de artigos, reconstruído apenas quando os dados mudam. */
export function criarBuscador(documentos: DocumentoBusca[]): Fuse<DocumentoBusca> {
  return new Fuse<DocumentoBusca>(documentos.map(doc=>({
    ...doc,
    buscaTitulo:normalizarTexto(doc.titulo),
    buscaTags:(doc.tags??[]).map(normalizarTexto),
    buscaCodigos:(doc.codigosErro??[]).map(normalizarCodigoErro),
    buscaResumo:normalizarTexto(doc.resumo),
    buscaSistema:normalizarTexto(doc.sistema),
    buscaCategoria:normalizarTexto(doc.nomeCategoria),
    buscaConteudo:normalizarTexto(doc.conteudoBusca)
  })), {
    ignoreDiacritics: true,
    ignoreLocation: true, // Encontra palavras mesmo no final de procedimentos longos.
    includeScore: true,
    threshold: 0.38,
    useTokenSearch: true,
    keys: [
      { name: "buscaCodigos", weight: 6 },
      { name: "buscaTitulo", weight: 5 },
      { name: "buscaTags", weight: 3 },
      { name: "buscaResumo", weight: 2.5 },
      { name: "buscaSistema", weight: 2 },
      { name: "buscaCategoria", weight: 1.2 },
      { name: "buscaConteudo", weight: 0.6 },
    ],
  });
}

export type ResultadoBusca = { artigo: DocumentoBusca; pontuacao: number };
/** Equivalências restritas, sem adivinhar regras fiscais ou substituir o termo original. */
const ALIASES_BUSCA = [
  ["nf-e", "nfe", "nota fiscal eletrônica"],
  ["nfc-e", "nfce", "nota fiscal consumidor"],
  ["impressão", "impressora", "imprime", "fila impressão"],
  ["login", "entrar sistema", "acesso sistema"],
  ["ibs cbs", "ibscbs", "reforma tributária"],
] as const;
export function variacoesBusca(termo:string):string[] {
  const chave=normalizarTexto(termo).replace(/\s+/g," ");
  const grupo=ALIASES_BUSCA.find(op=>op.some(v=>normalizarTexto(v)===chave));
  return grupo?grupo.filter(v=>normalizarTexto(v)!==chave):[];
}

/** Prioriza código exato e títulos; nas demais situações usa a relevância do Fuse. */
export function executarBusca(buscador: Fuse<DocumentoBusca>, consulta: string): ResultadoBusca[] {
  const termo = prepararConsulta(consulta);
  if (termo.length < MINIMO_CARACTERES_BUSCA) return [];

  const termoNormalizado = normalizar(termo);
  const combinados = new Map<string, {artigo: DocumentoBusca; pontuacao:number; prioridade:number}>();
  const consultas=[termo,...variacoesBusca(termo)];
  for (const [indice,consulta] of consultas.entries()) {
    for(const resultado of buscador.search(prepararConsulta(consulta))) {
      const artigo=resultado.item;
      const codigosErro=artigo.codigosErro??[];
      const codigoExato=indice===0&&codigosErro.some(c=>normalizarCodigoErro(c)===termoNormalizado);
      const codigoContem=indice===0&&codigosErro.some(c=>normalizarCodigoErro(c).split(" ").includes(termoNormalizado));
      const tituloContem=indice===0&&normalizarTexto(artigo.titulo).includes(termoNormalizado);
      const prioridade=indice>0?2:codigoExato?-3:codigoContem?-2:tituloContem?-1:0;
      const novo={artigo,pontuacao:(resultado.score??1)+(indice>0?0.2:0),prioridade};
      const anterior=combinados.get(artigo.url);
      if(!anterior||novo.prioridade<anterior.prioridade||
        (novo.prioridade===anterior.prioridade&&novo.pontuacao<anterior.pontuacao))combinados.set(artigo.url,novo);
    }
  }
  const resultados=[...combinados.values()];
  resultados.sort((a, b) =>
    a.prioridade - b.prioridade || a.pontuacao - b.pontuacao || a.artigo.titulo.localeCompare(b.artigo.titulo, "pt-BR"),
  );
  return resultados.map(({ artigo, pontuacao }) => ({ artigo, pontuacao }));
}

/** Encontra um trecho útil do corpo sem injetar HTML na página. */
export function trechoEncontrado(conteudo: string, consulta: string, tamanho = 180): string {
  if (!conteudo) return "";
  const simplificado = normalizarTexto(conteudo);
  const termos = normalizarTexto(consulta).split(/\s+/).filter((termo) => termo.length >= 3);
  const inicioTermo = termos.map((termo) => simplificado.indexOf(termo)).filter((i) => i >= 0);
  const posicao = inicioTermo.length ? Math.min(...inicioTermo) : 0;
  const inicio = Math.max(0, posicao - 65);
  const fim = Math.min(conteudo.length, inicio + tamanho);
  return `${inicio ? "…" : ""}${conteudo.slice(inicio, fim).trim()}${fim < conteudo.length ? "…" : ""}`;
}
