import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verificarOrigemPost } from "../../../../lib/origem";
import { encerrarSessao, obterSessao, NOME_COOKIE, opcoesCookie } from "../../../../lib/sessao";
import { registrarAuditoriaSegura } from "../../../../lib/auditoria-eventos";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const origem = verificarOrigemPost(req.headers);
  if (!origem.valida) return new NextResponse("Origem inválida", { status: 403 });
  try {const token=req.cookies.get(NOME_COOKIE)?.value;const usuario=await obterSessao(token);
    await encerrarSessao(token);if(usuario)await registrarAuditoriaSegura(usuario.id,"logout_sucesso","sessao");}
  catch { return new NextResponse("Não foi possível encerrar a sessão. Tente novamente.", { status: 503 }); }
  const resposta = NextResponse.redirect(new URL("/entrar", req.url), { status: 303 });
  resposta.cookies.set(NOME_COOKIE, "", { ...opcoesCookie(), maxAge: 0 });
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
