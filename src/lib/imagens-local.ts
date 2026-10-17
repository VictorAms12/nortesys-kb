/** Validação de bytes, independente do nome de arquivo fornecido pelo navegador. */
export const TAMANHO_MAXIMO_IMAGEM_LOCAL = 2 * 1024 * 1024;

export type TipoImagemLocal = { extensao: "png" | "jpg" | "webp"; mime: string };

export function identificarImagemLocal(bytes: Uint8Array, mimeDeclarado: string): TipoImagemLocal | null {
  if (!bytes.length || bytes.length > TAMANHO_MAXIMO_IMAGEM_LOCAL) return null;
  const png = bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) &&
    bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82;
  if (png && mimeDeclarado === "image/png") return { extensao: "png", mime: "image/png" };

  const jpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (jpeg && mimeDeclarado === "image/jpeg") return { extensao: "jpg", mime: "image/jpeg" };

  const ascii = (i: number, texto: string) => [...texto].every((char, n) => bytes[i + n] === char.charCodeAt(0));
  const webp = bytes.length >= 16 && ascii(0, "RIFF") && ascii(8, "WEBP") &&
    ["VP8 ", "VP8L", "VP8X"].some((formato) => ascii(12, formato));
  if (webp && mimeDeclarado === "image/webp") return { extensao: "webp", mime: "image/webp" };
  return null;
}

/** Mensagem usada para o atributo alt, sem sintaxe que quebre Markdown. */
export function altImagemLocal(nome: string): string {
  const semExtensao = nome.replace(/\.(png|jpe?g|webp)$/i, "");
  return (semExtensao.normalize("NFKC")
    .replace(/[\[\]()*!`<>\\\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Captura de tela").slice(0, 90);
}
