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
/** Equivalências restritas, sem adivinhar regras fiscais ou substituir o termo original. */
const ALIASES_BUSCA = [
  ["nf-e", "nfe", "nota fiscal eletrônica"],
  ["nfc-e", "nfce", "nota fiscal consumidor"],
  ["impressão", "impressora", "imprime", "fila impressão"],
  ["login", "entrar sistema", "acesso sistema"],
  ["ibs cbs", "ibscbs", "reforma tributária"],
] as const;
export function variacoesBusca(termo:string):string[] {
  const chave=normalizar(termo).replace(/\s+/g," ");
  const grupo=ALIASES_BUSCA.find(op=>op.some(v=>normalizar(v)===chave));
  return grupo?grupo.filter(v=>normalizar(v)!==chave):[];
}

function normalizar(termo: string): string {
  return termo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

/** Prioriza código exato e títulos; nas demais situações usa a relevância do Fuse. */
export function executarBusca(buscador: Fuse<DocumentoBusca>, consulta: string): ResultadoBusca[] {
  const termo = consulta.trim().replace(/\s+/g, " ").slice(0, 120);
  if (termo.length < MINIMO_CARACTERES_BUSCA) return [];

  const termoNormalizado = normalizar(termo);
  const combinados = new Map<string, {artigo: DocumentoBusca; pontuacao:number; prioridade:number}>();
  const consultas=[termo,...variacoesBusca(termo)];
  for (const [indice,consulta] of consultas.entries()) {
    for(const resultado of buscador.search(consulta)) {
      const artigo=resultado.item;
      const codigosErro=artigo.codigosErro??[];
      const codigoExato=indice===0&&codigosErro.some(c=>normalizar(c)===termoNormalizado);
      const codigoContem=indice===0&&codigosErro.some(c=>normalizar(c).includes(termoNormalizado));
      const tituloContem=indice===0&&normalizar(artigo.titulo).includes(termoNormalizado);
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
  const simplificado = normalizar(conteudo);
  const termos = normalizar(consulta).split(/\s+/).filter((termo) => termo.length >= 3);
  const inicioTermo = termos.map((termo) => simplificado.indexOf(termo)).filter((i) => i >= 0);
  const posicao = inicioTermo.length ? Math.min(...inicioTermo) : 0;
  const inicio = Math.max(0, posicao - 65);
  const fim = Math.min(conteudo.length, inicio + tamanho);
  return `${inicio ? "…" : ""}${conteudo.slice(inicio, fim).trim()}${fim < conteudo.length ? "…" : ""}`;
}
