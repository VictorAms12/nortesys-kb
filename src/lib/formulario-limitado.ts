/** Leitura multipart com limite real, independentemente de Content-Length. */
export class ErroFormularioLimitado extends Error {
  constructor(public readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

export async function lerFormularioLimitado(
  req: Request,
  maxBytes: number,
  mensagens: { grande: string; ausente: string; invalido: string },
): Promise<FormData> {
  const cabecalho = req.headers.get("content-length");
  if (cabecalho !== null && (!/^\d+$/.test(cabecalho) || Number(cabecalho) > maxBytes)) {
    throw new ErroFormularioLimitado(413, mensagens.grande);
  }
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
  } finally {
    leitor.releaseLock();
  }
  try {
    return await new Response(Buffer.concat(partes), {
      headers: { "Content-Type": req.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    throw new ErroFormularioLimitado(400, mensagens.invalido);
  }
}
