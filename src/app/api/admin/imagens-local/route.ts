/** Protótipo LOCAL: grava apenas em public/, não oferece armazenamento persistente na Vercel. */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NOME_COOKIE, obterSessao } from "../../../../lib/sessao";
import { verificarOrigemPost } from "../../../../lib/origem";
import { identificarImagemLocal, TAMANHO_MAXIMO_IMAGEM_LOCAL } from "../../../../lib/imagens-local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  // Defesa dupla: nunca criar uma rota pública de gravação em Production/Preview.
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  if (process.env.NODE_ENV !== "development" ||
      !/^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)) {
    return erro("Upload disponível somente em localhost durante o desenvolvimento.", 404);
  }
  if (!verificarOrigemPost(req.headers).valida) return erro("Origem inválida.", 403);

  const sessao = await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
  if (!sessao || (sessao.papel !== "administrador" && sessao.papel !== "editor")) {
    return erro("Acesso restrito a editores e administradores.", 403);
  }
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    return erro("Envie uma imagem pelo formulário.", 415);
  }
  const tamanhoCorpo = Number(req.headers.get("content-length") ?? "0");
  if (!Number.isFinite(tamanhoCorpo) || tamanhoCorpo > TAMANHO_MAXIMO_IMAGEM_LOCAL + 100_000) {
    return erro("Arquivo muito grande. Máximo: 2 MB.", 413);
  }

  try {
    const form = await req.formData();
    const arquivo = form.get("imagem");
    if (!(arquivo instanceof File) || arquivo.size === 0 || arquivo.size > TAMANHO_MAXIMO_IMAGEM_LOCAL) {
      return erro("Selecione uma imagem com até 2 MB.", 400);
    }
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = identificarImagemLocal(bytes, arquivo.type);
    if (!tipo) return erro("Formato inválido. Use PNG, JPG ou WebP autêntico.", 415);

    const pasta = resolve(process.cwd(), "public", "imagens", "uploads-locais");
    await mkdir(pasta, { recursive: true });
    const nome = `${randomUUID()}.${tipo.extensao}`;
    await writeFile(join(pasta, nome), bytes, { flag: "wx", mode: 0o600 });
    return NextResponse.json({ url: `/imagens/uploads-locais/${nome}` },
      { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return erro("Falha ao salvar a imagem localmente. Confira as permissões da pasta public/.", 500);
  }
}
