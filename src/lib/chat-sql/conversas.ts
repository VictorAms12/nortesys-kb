/** sql conversas — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_CONVERSAS = `
SELECT c.id,c.tipo,CASE WHEN c.tipo='geral' THEN 'Equipe — Geral'
 ELSE COALESCE(outro.nome,'Colaborador indisponível') END AS nome,
 (SELECT COUNT(*)::int FROM kb_chat_mensagens m
   WHERE m.conversa_id=c.id AND m.id>GREATEST(p.ultima_lida_id,p.limpa_ate_id)
     AND m.autor_id<>$1 AND m.apagada_para_todos_em IS NULL
     AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h
       WHERE h.usuario_id=$1 AND h.mensagem_id=m.id)) AS nao_lidas,
 CASE WHEN ultima.texto='' AND ultima.imagem_caminho IS NOT NULL THEN 'Imagem' ELSE ultima.texto END AS ultima_mensagem,ultima.criado_em::text AS ultimo_horario,outro.id AS outro_id,p.silenciada
 FROM kb_chat_conversas c
 JOIN kb_chat_participantes p ON p.conversa_id=c.id AND p.usuario_id=$1
 LEFT JOIN LATERAL (
   SELECT m.texto,m.imagem_caminho,m.criado_em FROM kb_chat_mensagens m
   WHERE m.conversa_id=c.id AND m.id>p.limpa_ate_id
     AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h WHERE h.usuario_id=$1 AND h.mensagem_id=m.id)
   ORDER BY m.id DESC LIMIT 1
 ) ultima ON TRUE
 LEFT JOIN LATERAL (
   SELECT u.id,u.nome FROM kb_chat_participantes p2
   JOIN kb_usuarios u ON u.id=p2.usuario_id
   WHERE p2.conversa_id=c.id AND p2.usuario_id<>$1 LIMIT 1
 ) outro ON TRUE
 ORDER BY CASE WHEN c.tipo='geral' THEN 0 ELSE 1 END,
   ultima.criado_em DESC NULLS LAST,c.criado_em DESC
`;

/** sql total nao lidas — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_TOTAL_NAO_LIDAS = `
SELECT COUNT(*)::int AS total FROM kb_chat_mensagens m
 JOIN kb_chat_participantes p ON p.conversa_id=m.conversa_id AND p.usuario_id=$1
 WHERE m.id>GREATEST(p.ultima_lida_id,p.limpa_ate_id)
 AND m.autor_id<>$1 AND m.apagada_para_todos_em IS NULL
 AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h WHERE h.usuario_id=$1 AND h.mensagem_id=m.id)
`;

/** sql marcar lida visivel — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_MARCAR_LIDA_VISIVEL = `
WITH teto AS (
 SELECT LEAST($3::bigint, COALESCE(MAX(m.id),0)) AS id
 FROM kb_chat_mensagens m WHERE m.conversa_id=$1
), atualizada AS (
 UPDATE kb_chat_participantes p SET ultima_lida_id=teto.id FROM teto
 WHERE p.conversa_id=$1 AND p.usuario_id=$2 AND p.ultima_lida_id<teto.id
 RETURNING p.usuario_id
) SELECT EXISTS(SELECT 1 FROM kb_chat_participantes WHERE usuario_id=$2 AND conversa_id=$1) AS existe,
 EXISTS(SELECT 1 FROM atualizada) AS alterou
`;
