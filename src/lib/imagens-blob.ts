import { del, get, put } from "@vercel/blob";
import type { DependenciasImagens } from "./imagens-servico";

/** Chamado somente pela composição server-only. SDK injetável para testar sem rede/credenciais. */
export function criarArmazenamentoBlob(sdk = { del, get, put }): Pick<DependenciasImagens, "gravar" | "apagar" | "ler"> {
  return {
    gravar: async (caminho, bytes, mime) => {
      await sdk.put(caminho, Buffer.from(bytes), { access: "private", contentType: mime,
        addRandomSuffix: false, allowOverwrite: false, abortSignal: AbortSignal.timeout(30_000) });
    },
    apagar: async caminho => { await sdk.del(caminho, { abortSignal: AbortSignal.timeout(15_000) }); },
    ler: async caminho => {
      const resultado = await sdk.get(caminho, { access: "private", abortSignal: AbortSignal.timeout(30_000) });
      if (!resultado || resultado.statusCode !== 200) return null;
      return { stream: resultado.stream, mime: resultado.blob.contentType, tamanho: resultado.blob.size };
    },
  };
}
