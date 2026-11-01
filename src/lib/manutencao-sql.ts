/** Limpeza por lotes pequenos para limitar locks e tempo de execução do cron. */
export const LOTE_MANUTENCAO = 200;
export const RODADAS_RETENCAO = 5;

export const SQL_LIMPAR_TEMPORARIOS = `
 WITH sessoes_pendentes AS (
  SELECT token_hash FROM kb_sessoes WHERE expira_em < NOW()
  ORDER BY expira_em LIMIT $1::int FOR UPDATE SKIP LOCKED
 ), sessoes AS (
  DELETE FROM kb_sessoes s USING sessoes_pendentes p
  WHERE s.token_hash=p.token_hash RETURNING s.token_hash
 ), tentativas_pendentes AS (
  SELECT chave FROM kb_login_tentativas WHERE expira_em < NOW()
  ORDER BY expira_em LIMIT $1::int FOR UPDATE SKIP LOCKED
 ), tentativas AS (
  DELETE FROM kb_login_tentativas t USING tentativas_pendentes p
  WHERE t.chave=p.chave RETURNING t.chave
 )
 SELECT ((SELECT COUNT(*) FROM sessoes)+(SELECT COUNT(*) FROM tentativas))::int AS total`;

export const SQL_LIMPAR_NOTIFICACOES = `
 WITH antigas AS (
  SELECT id FROM kb_notificacoes
  WHERE criada_em < NOW() - make_interval(days => $1::int)
  ORDER BY criada_em,id LIMIT $2::int FOR UPDATE SKIP LOCKED
 ), apagadas AS (
  DELETE FROM kb_notificacoes n USING antigas a WHERE n.id=a.id RETURNING n.id
 )
 SELECT COUNT(*)::int AS total FROM apagadas`;

export const SQL_LIMPAR_COTAS_AVATAR = `
 WITH antigas AS (
  SELECT usuario_id FROM kb_avatar_limites
  WHERE janela_em < NOW() - INTERVAL '1 day'
  ORDER BY janela_em LIMIT $1::int FOR UPDATE SKIP LOCKED
 ), apagadas AS (
  DELETE FROM kb_avatar_limites q USING antigas a WHERE q.usuario_id=a.usuario_id RETURNING q.usuario_id
 )
 SELECT COUNT(*)::int AS total FROM apagadas`;

export const SQL_LIMPAR_COTAS_BUSCA = `
 WITH antigas AS (
  SELECT usuario_id FROM kb_busca_sugestoes_limites
  WHERE janela_em < NOW() - INTERVAL '1 day'
  ORDER BY janela_em LIMIT $1::int FOR UPDATE SKIP LOCKED
 ), apagadas AS (
  DELETE FROM kb_busca_sugestoes_limites q USING antigas a WHERE q.usuario_id=a.usuario_id RETURNING q.usuario_id
 )
 SELECT COUNT(*)::int AS total FROM apagadas`;

/** Retenção da auditoria em lotes, com índice kb_auditoria_data_idx. */
export const SQL_LIMPAR_AUDITORIA = "WITH antigas AS (SELECT id FROM kb_auditoria WHERE data<NOW()-make_interval(days => $1::int) ORDER BY data,id LIMIT $2::int FOR UPDATE SKIP LOCKED),apagadas AS (DELETE FROM kb_auditoria a USING antigas x WHERE a.id=x.id RETURNING a.id) SELECT COUNT(*)::int AS total FROM apagadas";
