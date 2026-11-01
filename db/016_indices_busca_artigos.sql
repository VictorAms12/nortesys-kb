-- Fase 4: índices para buscas SQL em artigos, sem alterar o Fuse.js nem a visibilidade.
-- GIN em tsvector é nativo. pg_trgm e unaccent são opcionais quando disponíveis.
-- Aditiva e idempotente; executar somente no Neon de desenvolvimento inicialmente.
BEGIN;

CREATE INDEX IF NOT EXISTS kb_artigos_texto_fts_idx ON kb_artigos
 USING GIN (to_tsvector('portuguese', COALESCE(titulo,'') || ' ' || COALESCE(conteudo,'')));

-- Em bancos isolados de testes, extensões opcionais podem não estar disponíveis.
DO $extensoes_busca$
BEGIN
 BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
 EXCEPTION WHEN undefined_file OR insufficient_privilege OR feature_not_supported THEN
  RAISE NOTICE 'pg_trgm indisponível neste ambiente; índice trigram opcional ignorado';
 END;
 BEGIN
  CREATE EXTENSION IF NOT EXISTS unaccent;
 EXCEPTION WHEN undefined_file OR insufficient_privilege OR feature_not_supported THEN
  RAISE NOTICE 'unaccent indisponível neste ambiente; normalização opcional ignorada';
 END;
END $extensoes_busca$;

DO $trigrama$
BEGIN
 IF EXISTS (
  SELECT 1 FROM pg_opclass WHERE opcname='gin_trgm_ops'
 ) THEN
  CREATE INDEX IF NOT EXISTS kb_artigos_titulo_trgm_idx ON kb_artigos
   USING GIN (titulo gin_trgm_ops);
 END IF;
END $trigrama$;

COMMIT;
