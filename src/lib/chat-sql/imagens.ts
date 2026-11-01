/** sql inserir imagem chat — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_INSERIR_IMAGEM_CHAT = `
INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto,respondendo_a_id,imagem_caminho,imagem_mime,imagem_tamanho)
 SELECT $1,$2,$3,origem.id,$5,$6,$7 FROM kb_chat_participantes p
 LEFT JOIN LATERAL (
  SELECT m.id FROM kb_chat_mensagens m WHERE m.id=$4::bigint AND m.conversa_id=p.conversa_id
   AND m.id>p.limpa_ate_id AND m.apagada_para_todos_em IS NULL
   AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h WHERE h.usuario_id=$2 AND h.mensagem_id=m.id)
 ) origem ON TRUE
 WHERE p.conversa_id=$1 AND p.usuario_id=$2 AND ($4::bigint IS NULL OR origem.id IS NOT NULL)
 RETURNING id,conversa_id,autor_id,(SELECT nome FROM kb_usuarios WHERE id=$2) AS autor,
 texto,criado_em::text AS criado_em,respondendo_a_id
`;

/** sql ler imagem chat — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_LER_IMAGEM_CHAT = `
SELECT m.imagem_caminho,m.imagem_mime,m.imagem_tamanho FROM kb_chat_mensagens m
 JOIN kb_chat_participantes p ON p.conversa_id=m.conversa_id AND p.usuario_id=$1
 LEFT JOIN kb_chat_mensagens_ocultas o ON o.mensagem_id=m.id AND o.usuario_id=$1
 WHERE m.id=$2 AND m.id>p.limpa_ate_id AND m.apagada_para_todos_em IS NULL
 AND o.mensagem_id IS NULL AND m.imagem_caminho IS NOT NULL LIMIT 1
`;
