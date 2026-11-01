import "server-only";
import { unstable_cache } from "next/cache";
import type Fuse from "fuse.js";
import { carregarTodosArtigos } from "./artigos-banco";
import { contarPorCategoria } from "./artigos";
import { criarIndiceBusca, type DocumentoBusca } from "./indice-busca";
import { criarBuscador } from "./busca";
import { criarVocabulario } from "./busca-sugestoes";
import type { Papel } from "./usuarios";
import { TAG_INDICE_BUSCA } from "./tags-cache";
export { TAG_INDICE_BUSCA } from "./tags-cache";

type DadosBusca = {
  versao: string;
  indice: DocumentoBusca[];
  vocabulario: string[];
  categorias: { slug: string; quantidade: number }[];
  atualizadoEm: string;
};

const obterDadosEmCache = unstable_cache(async (papel: Papel): Promise<DadosBusca> => {
  const artigos = await carregarTodosArtigos(papel);
  const indice=criarIndiceBusca(artigos);
  const vocabulario=criarVocabulario(indice);
  console.info(`[kb-cache-busca] papel=${papel} vocabulario_kb=${(Buffer.byteLength(JSON.stringify(vocabulario))/1024).toFixed(1)} total_kb=${(Buffer.byteLength(JSON.stringify({indice,vocabulario}))/1024).toFixed(1)}`);
  return {
    versao: String(Date.now()),
    indice,
    vocabulario,
    categorias: contarPorCategoria(artigos).map(c => ({ slug: c.slug, quantidade: c.quantidade })),
    atualizadoEm: artigos.reduce((anterior, artigo) =>
      artigo.atualizadoEm > anterior ? artigo.atualizadoEm : anterior, ""),
  };
}, ["indice-busca-v1"], { tags: [TAG_INDICE_BUSCA], revalidate: 300 });

/** O papel faz parte da chave de cache: leitores nunca recebem rascunhos. */
export const obterDadosBusca = (papel: Papel) => obterDadosEmCache(papel);

const buscadores = new Map<Papel, { versao: string; buscador: Fuse<DocumentoBusca> }>();

/** Evita reconstruir o índice Fuse enquanto a versão dos artigos não mudar. */
export function buscadorEmMemoria(papel: Papel, dados: DadosBusca): Fuse<DocumentoBusca> {
  const anterior = buscadores.get(papel);
  if (anterior?.versao === dados.versao) return anterior.buscador;
  const buscador = criarBuscador(dados.indice);
  buscadores.set(papel, { versao: dados.versao, buscador });
  return buscador;
}
