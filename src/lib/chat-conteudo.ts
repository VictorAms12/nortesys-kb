/** Mesma normalização para texto puro e legenda de imagem; sem dependências de servidor. */
export const MAXIMO_TEXTO_CHAT = 2000;

export function normalizarTextoChat(texto: string): string {
  return texto.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
}

/** Somente imagens podem ser enviadas sem legenda. */
export function textoChatValido(texto: string, imagem: boolean): boolean {
  return texto.length <= MAXIMO_TEXTO_CHAT && (imagem || texto.length > 0);
}
