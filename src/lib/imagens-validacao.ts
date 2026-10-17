import sharp from "sharp";
import { identificarImagemLocal } from "./imagens-local";
import { TAMANHO_MAXIMO_IMAGEM, type MimeImagem } from "./imagens";

export class ErroImagem extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

/** Decodifica e recodifica: assinatura sozinha não detecta arquivos truncados ou polyglots. */
export async function validarImagem(bytes: Uint8Array, mimeDeclarado: string) {
  if (!bytes.length || bytes.length > TAMANHO_MAXIMO_IMAGEM) throw new ErroImagem(413, "A imagem deve ter até 2 MB.");
  const tipo = identificarImagemLocal(bytes, mimeDeclarado);
  if (!tipo) throw new ErroImagem(415, "Use um arquivo PNG, JPEG ou WebP válido.");
  try {
    const imagem = sharp(bytes, { limitInputPixels: 20_000_000, failOn: "warning" });
    const meta = await imagem.metadata();
    const formato = tipo.extensao === "jpg" ? "jpeg" : tipo.extensao;
    if (meta.format !== formato || (meta.pages ?? 1) !== 1) throw new Error("Formato inválido");
    // Remove EXIF e dados adicionais, preserva orientação e grava somente pixels decodificados.
    const { data, info } = await imagem.rotate().toFormat(formato).toBuffer({ resolveWithObject: true });
    if (data.length > TAMANHO_MAXIMO_IMAGEM) throw new ErroImagem(413, "A imagem normalizada excede 2 MB.");
    return { bytes: data, mime: tipo.mime as MimeImagem, extensao: tipo.extensao, largura: info.width, altura: info.height };
  } catch (erro) {
    if (erro instanceof ErroImagem) throw erro;
    throw new ErroImagem(415, "Imagem corrompida, animada ou com dimensões excessivas.");
  }
}
