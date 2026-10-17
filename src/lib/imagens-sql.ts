/** SQL parametrizado separado para os mesmos comandos serem exercitados em PostgreSQL em memória. */
export const RESERVAR_COTA_IMAGEM = `INSERT INTO kb_imagem_limites (usuario_id, janela_em, quantidade)
  VALUES ($1, NOW(), 1)
  ON CONFLICT (usuario_id) DO UPDATE SET
    quantidade = CASE WHEN kb_imagem_limites.janela_em <= NOW() - INTERVAL '1 hour' THEN 1 ELSE kb_imagem_limites.quantidade + 1 END,
    janela_em = CASE WHEN kb_imagem_limites.janela_em <= NOW() - INTERVAL '1 hour' THEN NOW() ELSE kb_imagem_limites.janela_em END
  WHERE kb_imagem_limites.janela_em <= NOW() - INTERVAL '1 hour' OR kb_imagem_limites.quantidade < $2
  RETURNING quantidade`;

export const OBTER_IMAGEM = `SELECT i.id, i.blob_caminho, i.mime, i.tamanho, i.usuario_id, i.artigo_id, i.estado,
  a.status AS artigo_status, a.arquivado AS artigo_arquivado,
  COALESCE(a.conteudo ~ ('/api/imagens/' || i.id::text || '([^0-9a-f-]|$)'), false) AS referencia_atual
  FROM kb_imagens i LEFT JOIN kb_artigos a ON a.id = i.artigo_id WHERE i.id = $1 LIMIT 1`;
