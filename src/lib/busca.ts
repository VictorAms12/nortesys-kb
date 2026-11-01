import Fuse from "fuse.js";
import type { DocumentoBusca } from "./indice-busca";
import { normalizarTexto, prepararConsulta, normalizarCodigoErro, radicalizarTexto } from "./busca-normalizacao";
import { GRUPOS_SINONIMOS } from "../../config/sinonimos";
import {confereTermos,tokensDocumento} from "./busca-sugestoes";

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
    buscaConteudo:normalizarTexto(doc.conteudoBusca),
    buscaRadicais:radicalizarTexto([doc.titulo,doc.resumo,doc.conteudoBusca,...(doc.tags??[])].join(" ")),
    buscaTokens:tokensDocumento(doc)
  })), {
    ignoreDiacritics: true,
    ignoreLocation: true, // Encontra palavras mesmo no final de procedimentos longos.
    includeScore: true,
    threshold: 0.30, // Menor que 0.38; filtro por distância reforça precisão.
    useTokenSearch: true,
    keys: [
      { name: "buscaCodigos", weight: 6 },
      { name: "buscaTitulo", weight: 5 },
      { name: "buscaTags", weight: 3 },
      { name: "buscaResumo", weight: 2.5 },
      { name: "buscaSistema", weight: 2 },
      { name: "buscaCategoria", weight: 1.2 },
      { name: "buscaConteudo", weight: 0.6 },
      { name: "buscaRadicais", weight: 0.45 },
    ],
  });
}

export type ResultadoBusca = { artigo: DocumentoBusca; pontuacao: number };
/** Equivalências restritas, sem adivinhar regras fiscais ou substituir o termo original. */
export function variacoesBusca(termo:string):string[] {
 const chave=normalizarTexto(termo);
 const grupos=GRUPOS_SINONIMOS.filter(grupo=>grupo.termos.some(t=>normalizarTexto(t)===chave));
 return [...new Set(grupos.flatMap(grupo=>grupo.termos).map(normalizarTexto).filter(t=>t!==chave))];
}

/** Prioriza código exato e títulos; nas demais situações usa a relevância do Fuse. */
export function executarBusca(buscador: Fuse<DocumentoBusca>, consulta: string): ResultadoBusca[] {
  const termo = prepararConsulta(consulta);
  if (termo.length < MINIMO_CARACTERES_BUSCA) return [];

  const termoNormalizado = normalizarCodigoErro(termo);
  const combinados = new Map<string, {artigo: DocumentoBusca; pontuacao:number; prioridade:number}>();
  const raiz=radicalizarTexto(termo);
  const consultas=[termo,...(raiz!==termo?[raiz]:[]),...variacoesBusca(termo)];
  const quantidadeOriginais=raiz!==termo?2:1;
  for (const [indice,consulta] of consultas.entries()) {
    for(const resultado of buscador.search(prepararConsulta(consulta))) {
      const artigo=resultado.item;
      if(!confereTermos((artigo as DocumentoBusca & {buscaTokens:string[]}).buscaTokens,consulta))continue;
      const codigosErro=artigo.codigosErro??[];
      const codigoExato=indice===0&&codigosErro.some(c=>normalizarCodigoErro(c)===termoNormalizado);
      const codigoContem=indice===0&&codigosErro.some(c=>normalizarCodigoErro(c).split(" ").includes(termoNormalizado));
      const tituloContem=indice===0&&normalizarTexto(artigo.titulo).includes(termoNormalizado);
      const prioridade=indice>=quantidadeOriginais?2:indice===1?1:codigoExato?-3:codigoContem?-2:tituloContem?-1:0;
      const novo={artigo,pontuacao:(resultado.score??1)+(indice>=quantidadeOriginais?0.25:indice===1?0.08:0),prioridade};
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

/** Fallback somente quando nenhum resultado AND; a UI deve marcar como aproximado. */
export function executarBuscaOu(buscador:Fuse<DocumentoBusca>,consulta:string):ResultadoBusca[]{
 const termos=prepararConsulta(consulta).split(" ").filter(t=>t.length>=2);
 if(termos.length<2)return [];
 const coletados=new Map<string,{artigo:DocumentoBusca;pontuacao:number;termos:number}>();
 for(const termo of termos){
  for(const {artigo,pontuacao} of executarBusca(buscador,termo)){
   const anterior=coletados.get(artigo.url);
   if(anterior){anterior.termos++;anterior.pontuacao=Math.min(anterior.pontuacao,pontuacao);}
   else coletados.set(artigo.url,{artigo,pontuacao,termos:1});
  }
 }
 return [...coletados.values()].sort((a,b)=>b.termos-a.termos||a.pontuacao-b.pontuacao)
  .map(({artigo,pontuacao})=>({artigo,pontuacao}));
}
