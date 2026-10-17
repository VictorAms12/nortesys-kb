import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { verificarOrigemPost } from "./origem";
import { descricaoImagem, MIMES_IMAGEM, TAMANHO_MAXIMO_IMAGEM, UUID_IMAGEM, type MimeImagem } from "./imagens";
import { ErroImagem, validarImagem } from "./imagens-validacao";
import type { Papel } from "./usuarios";
import { diagnosticoImagem, type DiagnosticoImagem, type EtapaImagem } from "./imagens-diagnostico";

export type ContaImagem = { id: string; papel: Papel };
export type RegistroImagem = {
  id: string; blob_caminho: string; mime: MimeImagem; tamanho: number; usuario_id: string | null;
  artigo_id: string | null; estado: string; artigo_status: string | null;
  artigo_arquivado: boolean | null; referencia_atual: boolean;
};
export type NovaImagem = {
  id: string; caminho: string; mime: MimeImagem; tamanho: number; usuario: string;
  alt: string; largura: number; altura: number;
};
export type DependenciasImagens = {
  diagnosticar?(diagnostico: DiagnosticoImagem): void;
  sessao(req: NextRequest): Promise<ContaImagem | null>;
  reservarCota(usuario: string): Promise<boolean>;
  inserir(imagem: NovaImagem): Promise<void>;
  estado(id: string, estado: "pronta" | "falhou" | "limpeza_pendente"): Promise<void>;
  obter(id: string): Promise<RegistroImagem | null>;
  gravar(caminho: string, bytes: Uint8Array, mime: MimeImagem): Promise<void>;
  apagar(caminho: string): Promise<void>;
  ler(caminho: string): Promise<{ stream: ReadableStream<Uint8Array>; mime: string; tamanho: number } | null>;
};

const cabecalhosPrivados = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
function erro(mensagem: string, status: number, extra: Record<string, string> = {}) {
  return Response.json({ erro: mensagem }, { status, headers: { ...cabecalhosPrivados, ...extra } });
}
export function podeLerImagem(conta: ContaImagem, imagem: RegistroImagem): boolean {
  if (imagem.estado !== "pronta") return false;
  if (!imagem.artigo_id) return conta.id === imagem.usuario_id && conta.papel !== "leitor";
  if (imagem.artigo_status === null) return false;
  if (conta.papel === "administrador" || conta.papel === "editor") return true;
  return !imagem.artigo_arquivado && imagem.referencia_atual &&
    (imagem.artigo_status === "revisado" || imagem.artigo_status === "obsoleto");
}

/** Lê no máximo o limite, inclusive quando Content-Length está ausente ou é falso. */
async function formularioLimitado(req: NextRequest): Promise<FormData> {
  const limite = TAMANHO_MAXIMO_IMAGEM + 32_768;
  const tamanho = req.headers.get("content-length");
  if (tamanho !== null && (!/^\d+$/.test(tamanho) || Number(tamanho) > limite)) throw new ErroImagem(413, "Arquivo muito grande. Máximo: 2 MB.");
  if (!req.body) throw new ErroImagem(400, "Envie uma imagem.");
  const leitor = req.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > limite) { await leitor.cancel(); throw new ErroImagem(413, "Arquivo muito grande. Máximo: 2 MB."); }
      partes.push(value);
    }
  } finally { leitor.releaseLock(); }
  try {
    return await new Response(Buffer.concat(partes), { headers: { "Content-Type": req.headers.get("content-type")! } }).formData();
  } catch { throw new ErroImagem(400, "Formulário de imagem inválido."); }
}

export function criarRotasImagens(dep: DependenciasImagens) {
  return {
    async enviar(req: NextRequest): Promise<Response> {
      try {
        if (!verificarOrigemPost(req.headers).valida) return erro("Origem inválida.", 403);
        const conta = await dep.sessao(req);
        if (!conta) return erro("Autenticação necessária.", 401);
        if (conta.papel !== "editor" && conta.papel !== "administrador") return erro("Somente editores e administradores podem enviar imagens.", 403);
        if (!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) return erro("Envie uma imagem pelo formulário.", 415);
        // Reserva atômica no banco: compartilhada entre instâncias da Vercel e inclui tentativas inválidas.
        if (!await dep.reservarCota(conta.id)) return erro("Limite de 20 envios por hora atingido. Tente mais tarde.", 429, { "Retry-After": "3600" });
        const form = await formularioLimitado(req);
        const arquivo = form.get("imagem");
        if (!(arquivo instanceof File) || form.getAll("imagem").length !== 1) return erro("Selecione uma única imagem.", 400);
        if (!MIMES_IMAGEM.some(mime => mime === arquivo.type)) return erro("Use PNG, JPEG ou WebP.", 415);
        const validada = await validarImagem(new Uint8Array(await arquivo.arrayBuffer()), arquivo.type);
        const alt = descricaoImagem(typeof form.get("alt") === "string" ? String(form.get("alt")) : arquivo.name);
        const id = randomUUID();
        const caminho = `kb-imagens/${id}.${validada.extensao}`;
        // Registra o caminho antes do PUT: mesmo um processo interrompido deixa rastro para reconciliação.
        await dep.inserir({ id, caminho, mime: validada.mime, tamanho: validada.bytes.length,
          usuario: conta.id, alt, largura: validada.largura, altura: validada.altura });
        let etapa: EtapaImagem = "blob_gravar";
        try {
          await dep.gravar(caminho, validada.bytes, validada.mime);
          etapa = "banco_confirmar";
          await dep.estado(id, "pronta");
        } catch (falha) {
          const diagnostico = diagnosticoImagem(falha, etapa);
          dep.diagnosticar?.(diagnostico);
          let estado: "falhou" | "limpeza_pendente" = "falhou";
          try { await dep.apagar(caminho); } catch (falhaLimpeza) {
            estado = "limpeza_pendente";
            dep.diagnosticar?.(diagnosticoImagem(falhaLimpeza, "blob_compensar"));
          }
          try { await dep.estado(id, estado); } catch (falhaBanco) {
            dep.diagnosticar?.(diagnosticoImagem(falhaBanco, "banco_compensar"));
          }
          return erro(`Não foi possível concluir o upload. Código: ${diagnostico.codigo}.`, 503);
        }
        return Response.json({ id, url: `/api/imagens/${id}`, alt }, { status: 201, headers: cabecalhosPrivados });
      } catch (falha) {
        if (falha instanceof ErroImagem) return erro(falha.message, falha.status);
        return erro("Upload indisponível. Confira a configuração e a migração de imagens.", 503);
      }
    },
    async ler(req: NextRequest, id: string): Promise<Response> {
      try {
        const conta = await dep.sessao(req);
        if (!conta) return erro("Autenticação necessária.", 401);
        if (!UUID_IMAGEM.test(id)) return erro("Imagem não encontrada.", 404);
        const imagem = await dep.obter(id);
        if (!imagem || !podeLerImagem(conta, imagem)) return erro("Imagem não encontrada.", 404);
        const extensao = imagem.mime === "image/jpeg" ? "jpg" : imagem.mime === "image/png" ? "png" : imagem.mime === "image/webp" ? "webp" : null;
        if (!extensao || imagem.blob_caminho !== `kb-imagens/${id}.${extensao}`) return erro("Imagem indisponível.", 503);
        const arquivo = await dep.ler(imagem.blob_caminho);
        if (!arquivo) return erro("Imagem não encontrada.", 404);
        if (arquivo.mime !== imagem.mime || arquivo.tamanho !== imagem.tamanho) {
          await arquivo.stream.cancel();
          return erro("Imagem indisponível.", 503);
        }
        // Somente cabeçalhos próprios: nunca redirecionar nem repassar URL/headers do Blob.
        return new Response(arquivo.stream, { headers: { ...cabecalhosPrivados,
          "Content-Type": imagem.mime, "Content-Length": String(imagem.tamanho),
          "Content-Disposition": "inline", "Cross-Origin-Resource-Policy": "same-origin" } });
      } catch { return erro("Imagem indisponível.", 503); }
    },
  };
}
