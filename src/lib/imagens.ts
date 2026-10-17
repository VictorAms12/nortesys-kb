/** Contrato compartilhado pelo editor e pelo servidor; não contém credenciais. */
import { altImagemLocal } from "./imagens-local";

export const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024;
export const LIMITE_UPLOADS_POR_HORA = 20;
export const UUID_IMAGEM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const URL_IMAGEM_PRIVADA = /^\/api\/imagens\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const MIMES_IMAGEM = ["image/png", "image/jpeg", "image/webp"] as const;
export type MimeImagem = typeof MIMES_IMAGEM[number];

export function descricaoImagem(texto: string): string {
  return altImagemLocal(texto).slice(0, 90);
}

export function inserirReferenciaImagem(texto: string, inicio: number, fim: number, url: string, alt: string) {
  if (!URL_IMAGEM_PRIVADA.test(url)) throw new Error("Referência de imagem inválida.");
  const onde = Math.max(0, Math.min(inicio, texto.length));
  const ate = Math.max(onde, Math.min(fim, texto.length));
  const insercao = `\n\n![${descricaoImagem(alt)}](${url})\n\n`;
  const conteudo = texto.slice(0, onde) + insercao + texto.slice(ate);
  if (conteudo.length > 60000) throw new Error("Não há espaço no artigo para inserir a imagem (limite de 60.000 caracteres).");
  return { conteudo, cursor: onde + insercao.length };
}
