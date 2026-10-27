import "server-only";
import {consultar} from "./banco";

/**
 * Aplicação compatível com produção antes da migração 009.
 * Em ambientes cujo PostgreSQL ainda não recebeu a migração,
 * as novas áreas não executam consultas nas tabelas ausentes.
 * Cada requisição revalida para habilitar o recurso sem redeploy após SQL.
 */
export async function migracao009Aplicada():Promise<boolean>{
 const linhas=await consultar<{aplicada:boolean}>(`SELECT
  to_regclass('kb_artigo_feedback') IS NOT NULL
  AND to_regclass('kb_buscas_sem_resultado') IS NOT NULL
  AND to_regclass('kb_busca_estatistica_limites') IS NOT NULL
  AND to_regclass('kb_chat_imagens_limpeza') IS NOT NULL AS aplicada`);
 return linhas[0]?.aplicada===true;
}
