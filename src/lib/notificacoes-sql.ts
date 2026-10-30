/** Queries da central; importáveis pelos testes PGlite sem conexões externas. */
const VISIVEIS = `FROM kb_notificacoes n
 JOIN kb_usuarios u ON u.id=n.autor_id
 JOIN kb_chat_conversas c ON c.id=n.conversa_id
 JOIN kb_chat_participantes p ON p.conversa_id=n.conversa_id AND p.usuario_id=n.destinatario_id
 JOIN kb_chat_mensagens m ON m.id=n.mensagem_id AND m.conversa_id=n.conversa_id
 WHERE n.destinatario_id=$1
 AND m.apagada_para_todos_em IS NULL
 AND m.id>p.limpa_ate_id
 AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h
  WHERE h.usuario_id=n.destinatario_id AND h.mensagem_id=m.id)`;
export const SQL_LISTAR_NOTIFICACOES = `SELECT n.id::text AS id,
 n.conversa_id::text AS "conversaId",u.nome AS autor,
 n.criada_em::text AS "criadaEm",n.vista_em::text AS "vistaEm",c.tipo
 ${VISIVEIS} ORDER BY n.id DESC LIMIT 40`;
export const SQL_CONTAR_NOTIFICACOES = `SELECT COUNT(*)::int AS total
 ${VISIVEIS} AND n.vista_em IS NULL`;
export const SQL_MARCAR_NOTIFICACOES = "UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND id=ANY($2::bigint[]) AND vista_em IS NULL";
export const SQL_MARCAR_NOTIFICACOES_CONVERSA = "UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND conversa_id=$2 AND vista_em IS NULL";
export const SQL_MARCAR_TODAS_NOTIFICACOES = "UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND vista_em IS NULL";
export const NOTIFICACAO_ID = /^[1-9][0-9]{0,17}$/;
