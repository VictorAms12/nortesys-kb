import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NOME_COOKIE, obterSessao, papelPermitido } from "./sessao";
import type { Papel, UsuarioPublico } from "./usuarios";

export async function exigirSessao(): Promise<UsuarioPublico> {
  const cookie = (await cookies()).get(NOME_COOKIE)?.value;
  const sessao = await obterSessao(cookie);
  if (!sessao) redirect("/entrar");
  return sessao;
}
/** Para próximas rotas de edição/administração da Fase 6. */
export async function exigirPapel(papeis: readonly Papel[]): Promise<UsuarioPublico> {
  const conta = await exigirSessao();
  if (!papelPermitido(conta.papel, papeis)) redirect("/");
  return conta;
}
