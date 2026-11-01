/** sql listar mensagens — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_LISTAR_MENSAGENS = `
SELECT m.id,m.conversa_id,m.autor_id,u.nome AS autor,m.texto,
 m.criado_em::text AS criado_em,m.apagada_para_todos_em IS NOT NULL AS apagada_para_todos,
 m.imagem_caminho IS NOT NULL AND m.apagada_para_todos_em IS NULL AS tem_imagem,
 m.respondendo_a_id,
 CASE WHEN original.id IS NULL THEN NULL
  WHEN original.apagada_para_todos_em IS NOT NULL THEN '[Mensagem apagada]'
  WHEN original.id<=p.limpa_ate_id OR ocultada_original.mensagem_id IS NOT NULL THEN '[Mensagem indisponível]'
  ELSE CASE WHEN original.texto='' AND original.imagem_caminho IS NOT NULL THEN 'Imagem' ELSE original.texto END END AS resposta_texto,
 CASE WHEN original.id>p.limpa_ate_id AND ocultada_original.mensagem_id IS NULL
  THEN autor_original.nome ELSE NULL END AS resposta_autor
 FROM kb_chat_mensagens m
 JOIN kb_chat_participantes p ON p.conversa_id=m.conversa_id AND p.usuario_id=$1
 JOIN kb_usuarios u ON u.id=m.autor_id
 LEFT JOIN kb_chat_mensagens_ocultas ocultada ON ocultada.usuario_id=$1 AND ocultada.mensagem_id=m.id
 LEFT JOIN kb_chat_mensagens original ON original.id=m.respondendo_a_id AND original.conversa_id=m.conversa_id
 LEFT JOIN kb_usuarios autor_original ON autor_original.id=original.autor_id
 LEFT JOIN kb_chat_mensagens_ocultas ocultada_original
  ON ocultada_original.usuario_id=$1 AND ocultada_original.mensagem_id=original.id
 WHERE m.conversa_id=$2 AND m.id>p.limpa_ate_id AND ocultada.mensagem_id IS NULL
  AND ($3::bigint IS NULL OR m.id<$3::bigint)
  AND ($4::text='' OR m.texto ILIKE ('%'||$4||'%')
   OR (m.texto='' AND m.imagem_caminho IS NOT NULL AND 'Imagem' ILIKE ('%'||$4||'%')))
 ORDER BY m.id DESC LIMIT 60
`;

/** sql inserir mensagem — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_INSERIR_MENSAGEM = `
INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto,respondendo_a_id)
 SELECT $1,$2,$3,origem.id FROM kb_chat_participantes p
 LEFT JOIN LATERAL (
  SELECT m.id FROM kb_chat_mensagens m
  WHERE m.id=$4::bigint AND m.conversa_id=p.conversa_id
    AND m.id>p.limpa_ate_id AND m.apagada_para_todos_em IS NULL
    AND NOT EXISTS(SELECT 1 FROM kb_chat_mensagens_ocultas h WHERE h.usuario_id=$2 AND h.mensagem_id=m.id)
 ) origem ON TRUE
 WHERE p.conversa_id=$1 AND p.usuario_id=$2 AND ($4::bigint IS NULL OR origem.id IS NOT NULL)
 RETURNING id,conversa_id,autor_id,
 (SELECT nome FROM kb_usuarios WHERE id=$2) AS autor, texto,criado_em::text AS criado_em,respondendo_a_id
`;

/** sql apagar para mim — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_APAGAR_PARA_MIM = `
INSERT INTO kb_chat_mensagens_ocultas(usuario_id,mensagem_id)
 SELECT $1,m.id FROM kb_chat_mensagens m
 JOIN kb_chat_participantes p ON p.conversa_id=m.conversa_id AND p.usuario_id=$1
 WHERE m.id=$2 AND m.conversa_id=$3 AND m.id>p.limpa_ate_id
 ON CONFLICT DO NOTHING RETURNING mensagem_id
`;

/** sql apagar para todos — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_APAGAR_PARA_TODOS = `
UPDATE kb_chat_mensagens m SET texto='[Mensagem apagada]',apagada_para_todos_em=NOW()
 WHERE m.id=$2 AND m.conversa_id=$3 AND m.autor_id=$1 AND m.apagada_para_todos_em IS NULL
 AND EXISTS(SELECT 1 FROM kb_chat_participantes p WHERE p.usuario_id=$1 AND p.conversa_id=m.conversa_id)
 RETURNING m.id
`;

/** sql limpar conversa — SQL parametrizado compartilhado com testes PGlite. */
export const SQL_LIMPAR_CONVERSA = `
UPDATE kb_chat_participantes p SET
 limpa_ate_id=GREATEST(p.limpa_ate_id,COALESCE((SELECT MAX(m.id) FROM kb_chat_mensagens m WHERE m.conversa_id=$1),0)),
 ultima_lida_id=GREATEST(p.ultima_lida_id,COALESCE((SELECT MAX(m.id) FROM kb_chat_mensagens m WHERE m.conversa_id=$1),0))
 WHERE p.usuario_id=$2 AND p.conversa_id=$1 RETURNING p.usuario_id
`;
