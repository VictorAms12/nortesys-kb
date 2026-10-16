import { neon } from "@neondatabase/serverless";

/** Executa consultas parametrizadas. Nunca passe dados do usuário no texto SQL. */
export async function consultar<T>(consulta: string, parametros: unknown[] = []): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) throw new Error("DATABASE_URL não configurada");
  const sql = neon(url);
  const linhas = await sql.query(consulta, parametros);
  return linhas as T[];
}

export function bancoConfigurado(): boolean {
  return /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
}
