/** Sessões opacas: token aleatório no cookie, somente SHA-256 no PostgreSQL. */
import { createHash, randomBytes } from "node:crypto";
import { bancoConfigurado, consultar } from "./banco";
import type { Usuario, UsuarioPublico, Papel } from "./usuarios";

export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;
export const NOME_COOKIE = process.env.NODE_ENV === "production" ? "__Host-nortesys-kb" : "nortesys-kb-dev";
export function autenticacaoConfigurada(): boolean { return bancoConfigurado(); }

function hashToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export async function criarTokenSessao(conta: Usuario): Promise<string> {
  if (!conta.ativo) throw new Error("Conta desativada");
  const token = `v3.${randomBytes(32).toString("hex")}`;
  await consultar(`INSERT INTO kb_sessoes (token_hash, usuario_id, versao_sessao, expira_em)
    VALUES ($1, $2, $3, NOW() + INTERVAL '8 hours')`, [hashToken(token), conta.id, conta.versao_sessao]);
  return token;
}
export async function obterSessao(token: unknown): Promise<UsuarioPublico | null> {
  if (typeof token !== "string" || !/^v3\.[0-9a-f]{64}$/.test(token) || !bancoConfigurado()) return null;
  const linhas = await consultar<UsuarioPublico>(`
    SELECT u.id, u.usuario, u.nome, u.papel FROM kb_sessoes s
    JOIN kb_usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = $1 AND s.expira_em > NOW() AND u.ativo = true
      AND s.versao_sessao = u.versao_sessao LIMIT 1`, [hashToken(token)]);
  return linhas[0] ?? null;
}
export async function validarTokenSessao(token: unknown): Promise<boolean> {
  return (await obterSessao(token)) !== null;
}
export async function encerrarSessao(token: unknown): Promise<void> {
  if (typeof token !== "string" || !/^v3\.[0-9a-f]{64}$/.test(token)) return;
  await consultar("DELETE FROM kb_sessoes WHERE token_hash = $1", [hashToken(token)]);
}
export function opcoesCookie(): { httpOnly: true; secure: boolean; sameSite: "strict"; path: "/"; maxAge: number } {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: DURACAO_SESSAO_MS / 1000 };
}
/** Acesso por papel, sempre consultado no banco; nunca confiar no papel recebido do navegador. */
export function papelPermitido(papel: Papel, permitidos: readonly Papel[]): boolean { return permitidos.includes(papel); }

/** Apenas redirecionamentos internos previamente permitidos. */
export function destinoSeguro(entrada: unknown): string {
  if (typeof entrada !== "string" || entrada.length > 400 || entrada.includes("\\") || /[\r\n]/.test(entrada)) return "/";
  if (entrada === "/") return "/";
  if (!/^\/(busca|categorias|artigos|admin|favoritos|recentes)(?:\/|\?|$)/.test(entrada) || entrada.startsWith("//")) return "/";
  try {
    const url = new URL(entrada, "http://localhost");
    if (url.origin !== "http://localhost" || url.pathname.includes("//")) return "/";
    return url.pathname + url.search;
  } catch { return "/"; }
}
