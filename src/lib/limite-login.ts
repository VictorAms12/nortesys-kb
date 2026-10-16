/** Contador de tentativas compartilhado por todas as instâncias da Vercel. */
import { consultar } from "./banco";
export const MAXIMO_TENTATIVAS = 5;
export function chaveTentativas(usuario: unknown): string {
  if (typeof usuario !== "string" || !/^[a-z][a-z0-9._-]{2,39}$/.test(usuario)) return "usuario:invalido";
  return `usuario:${usuario}`;
}
export async function registrarTentativa(chave: string): Promise<boolean> {
  const linhas = await consultar<{ quantidade: number }>(`
    INSERT INTO kb_login_tentativas(chave, quantidade, expira_em)
    VALUES ($1, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (chave) DO UPDATE SET
      quantidade = CASE WHEN kb_login_tentativas.expira_em <= NOW() THEN 1
        ELSE kb_login_tentativas.quantidade + 1 END,
      expira_em = CASE WHEN kb_login_tentativas.expira_em <= NOW()
        THEN NOW() + INTERVAL '15 minutes' ELSE kb_login_tentativas.expira_em END
    RETURNING quantidade`, [chave]);
  return (linhas[0]?.quantidade ?? MAXIMO_TENTATIVAS + 1) <= MAXIMO_TENTATIVAS;
}
export async function limparTentativas(chave: string): Promise<void> {
  await consultar("DELETE FROM kb_login_tentativas WHERE chave = $1", [chave]);
}
