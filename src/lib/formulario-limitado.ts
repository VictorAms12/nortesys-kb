/** Leitura HTTP com limite real de bytes, inclusive sem Content-Length. */
export class ErroFormularioLimitado extends Error {
  constructor(public readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

type Mensagens = { grande: string; ausente: string; invalido: string };

async function lerBytesLimitados(req: Request, maxBytes: number, mensagens: Mensagens): Promise<Buffer> {
  const cabecalho = req.headers.get("content-length");
  if (cabecalho !== null && (!/^\d+$/.test(cabecalho) || Number(cabecalho) > maxBytes))
    throw new ErroFormularioLimitado(413, mensagens.grande);
  if (!req.body) throw new ErroFormularioLimitado(400, mensagens.ausente);
  const leitor = req.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await leitor.cancel();
        throw new ErroFormularioLimitado(413, mensagens.grande);
      }
      partes.push(value);
    }
  } finally { leitor.releaseLock(); }
  return Buffer.concat(partes, total);
}

/** Suporta JSON e texto; não materializa cargas maiores que o limite. */
export async function lerTextoLimitado(req: Request, maxBytes: number, mensagemGrande = "Conteúdo muito grande."): Promise<string> {
  const bytes = await lerBytesLimitados(req, maxBytes, {
    grande: mensagemGrande, ausente: "Corpo da requisição ausente.", invalido: "Corpo inválido.",
  });
  return new TextDecoder("utf-8").decode(bytes);
}

/** Mantém FormData, inclusive campos repetidos, para formulários URL-encoded. */
export async function lerFormularioUrlEncodedLimitado(req: Request, maxBytes: number): Promise<FormData> {
  const texto = await lerTextoLimitado(req, maxBytes, "Formulário inválido.");
  const form = new FormData();
  for (const [nome, valor] of new URLSearchParams(texto)) form.append(nome, valor);
  return form;
}

/** Upload multipart existente também usa o leitor compartilhado. */
export async function lerFormularioLimitado(req: Request, maxBytes: number, mensagens: Mensagens): Promise<FormData> {
  const bytes = await lerBytesLimitados(req, maxBytes, mensagens);
  try {
    return await new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": req.headers.get("content-type") ?? "" },
    }).formData();
  } catch { throw new ErroFormularioLimitado(400, mensagens.invalido); }
}
