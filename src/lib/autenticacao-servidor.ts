import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NOME_COOKIE, obterSessao, papelPermitido } from "./sessao";
import type { Papel, UsuarioPublico } from "./usuarios";

/** Compartilhada por layout, página e metadados somente nesta requisição. */
export const sessaoAtual = cache(async (): Promise<UsuarioPublico | null> => {
  const cookie = (await cookies()).get(NOME_COOKIE)?.value;
  return obterSessao(cookie);
});

export async function exigirSessao(): Promise<UsuarioPublico> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return sessao;
}
/** Para próximas rotas de edição/administração da Fase 6. */
export async function exigirPapel(papeis: readonly Papel[]): Promise<UsuarioPublico> {
  const conta = await exigirSessao();
  if (!papelPermitido(conta.papel, papeis)) redirect("/");
  return conta;
}
