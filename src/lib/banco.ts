import { neon } from "@neondatabase/serverless";

/** O cliente HTTP do Neon não é uma conexão PostgreSQL aberta. Reutiliza-se apenas
 *  a função parametrizada; nenhum resultado ou credencial aparece em cache público. */
let cliente: {url: string; sql: ReturnType<typeof neon>} | null = null;
function clienteNeon(): ReturnType<typeof neon> {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL não configurada");
  if (!cliente || cliente.url !== url) cliente = {url, sql: neon(url)};
  return cliente.sql;
}

/** Executa consultas parametrizadas. Nunca passe dados do usuário no texto SQL. */
export async function consultar<T>(consulta: string, parametros: unknown[] = []): Promise<T[]> {
  return await clienteNeon().query(consulta, parametros) as T[];
}

export function bancoConfigurado(): boolean {
  return /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
}
