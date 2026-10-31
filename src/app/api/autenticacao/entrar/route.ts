import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verificarOrigemPost } from "../../../../lib/origem";
import { chaveTentativas, registrarTentativa, limparTentativas } from "../../../../lib/limite-login";
import { autenticacaoConfigurada, criarTokenSessao, destinoSeguro, NOME_COOKIE, opcoesCookie } from "../../../../lib/sessao";
import { conferirCredenciais } from "../../../../lib/usuarios";
import { registrarAuditoriaSegura } from "../../../../lib/auditoria-eventos";
import { ErroFormularioLimitado, lerFormularioUrlEncodedLimitado } from "../../../../lib/formulario-limitado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function voltar(req: NextRequest, erro: string): NextResponse {
  const url = new URL("/entrar", req.url);
  url.searchParams.set("erro", erro);
  const res = NextResponse.redirect(url, { status: 303 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
export async function POST(req: NextRequest) {
  const origem = verificarOrigemPost(req.headers);
  if (!origem.valida) return new NextResponse(
    process.env.NODE_ENV === "production" ? "Origem inválida" : `Origem inválida [${origem.motivo}]`,
    { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!autenticacaoConfigurada()) return voltar(req, "configuracao");
  const tipo = req.headers.get("content-type") ?? "";
  if (!tipo.includes("application/x-www-form-urlencoded"))
    return new NextResponse("Formulário inválido", { status: 400 });
  let formulario: FormData;
  try { formulario = await lerFormularioUrlEncodedLimitado(req, 4096); }
  catch (e) {
    if (e instanceof ErroFormularioLimitado) return new NextResponse("Formulário inválido", { status: 400 });
    return voltar(req, "credenciais");
  }
  const usuario = formulario.get("usuario");
  const senha = formulario.get("senha");
  const chave = chaveTentativas(usuario);
  try {
    if (!(await registrarTentativa(chave))) return voltar(req, "bloqueado");
    const conta = await conferirCredenciais(usuario, senha);
    if (!conta) {await registrarAuditoriaSegura(null,"login_falha","credenciais_invalidas",{limitarMinutos:1});return voltar(req,"credenciais");}
    const token = await criarTokenSessao(conta);
    await limparTentativas(chave);
    const destino = destinoSeguro(formulario.get("retorno"));
    const resposta = NextResponse.redirect(new URL(destino, req.url), { status: 303 });
    resposta.cookies.set(NOME_COOKIE, token, opcoesCookie());
    await registrarAuditoriaSegura(conta.id,"login_sucesso","sessao");
    resposta.headers.set("Cache-Control", "no-store");
    return resposta;
  } catch (erro) {
    console.error("Falha ao autenticar usuário (verifique a conexão e as tabelas do banco).", erro instanceof Error ? erro.name : "erro");
    return voltar(req, "indisponivel");
  }
}
