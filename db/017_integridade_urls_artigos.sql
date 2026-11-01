-- Fase 5: preservar vínculos e URLs históricas ao alterar categoria/slug de artigos.
-- Aditiva/idempotente, sem excluir artigos, anexos, imagens nem contas.
-- IMPORTANTE: a cópia dos vínculos ocorre na mesma transação da edição.
BEGIN;

CREATE TABLE IF NOT EXISTS kb_artigo_aliases (
  url_anterior VARCHAR(300) PRIMARY KEY
    CHECK (url_anterior ~ '^/artigos/[a-z0-9-]+/[a-z0-9-]+$'),
  artigo_id UUID NOT NULL REFERENCES kb_artigos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kb_artigo_aliases_artigo_idx ON kb_artigo_aliases(artigo_id);

-- Não permitir que um artigo novo assuma uma URL antiga pertencente a outro artigo.
-- Bloqueio por URL impede corrida entre renomeação e criação, até em várias instâncias.
CREATE OR REPLACE FUNCTION kb_validar_url_artigo()
RETURNS TRIGGER LANGUAGE plpgsql AS $validar_url$
DECLARE
 atual TEXT := '/artigos/' || NEW.categoria || '/' || NEW.slug;
 anterior TEXT;
 dono UUID;
BEGIN
 IF TG_OP='UPDATE' THEN
  anterior := '/artigos/' || OLD.categoria || '/' || OLD.slug;
  IF anterior=atual THEN RETURN NEW; END IF;
  IF anterior < atual THEN
   PERFORM pg_advisory_xact_lock(hashtextextended(anterior,17317));
   PERFORM pg_advisory_xact_lock(hashtextextended(atual,17317));
  ELSE
   PERFORM pg_advisory_xact_lock(hashtextextended(atual,17317));
   PERFORM pg_advisory_xact_lock(hashtextextended(anterior,17317));
  END IF;
 ELSE
  PERFORM pg_advisory_xact_lock(hashtextextended(atual,17317));
 END IF;

 SELECT artigo_id INTO dono FROM kb_artigo_aliases WHERE url_anterior=atual;
 IF dono IS NOT NULL AND dono<>NEW.id THEN
  RAISE EXCEPTION 'URL de artigo reservada por versão anterior'
   USING ERRCODE='23505',CONSTRAINT='kb_artigo_aliases_pkey';
 END IF;
 -- Retorno do mesmo artigo a uma de suas próprias URLs históricas.
 IF dono=NEW.id THEN
  DELETE FROM kb_artigo_aliases WHERE url_anterior=atual AND artigo_id=NEW.id;
 END IF;
 RETURN NEW;
END $validar_url$;

CREATE OR REPLACE FUNCTION kb_migrar_url_artigo()
RETURNS TRIGGER LANGUAGE plpgsql AS $migrar_url$
DECLARE
 anterior TEXT := '/artigos/' || OLD.categoria || '/' || OLD.slug;
 atual TEXT := '/artigos/' || NEW.categoria || '/' || NEW.slug;
BEGIN
 IF anterior=atual THEN RETURN NEW; END IF;
 INSERT INTO kb_artigo_aliases(url_anterior,artigo_id)
 VALUES(anterior,NEW.id)
 ON CONFLICT(url_anterior) DO UPDATE SET artigo_id=EXCLUDED.artigo_id
 WHERE kb_artigo_aliases.artigo_id=EXCLUDED.artigo_id;

 -- Preservar favorito antigo e sua data mais antiga quando as URLs coexistirem.
 INSERT INTO kb_favoritos(usuario_id,artigo_url,criado_em)
 SELECT usuario_id,atual,criado_em FROM kb_favoritos WHERE artigo_url=anterior
 ON CONFLICT(usuario_id,artigo_url) DO UPDATE
  SET criado_em=LEAST(kb_favoritos.criado_em,EXCLUDED.criado_em);
 DELETE FROM kb_favoritos WHERE artigo_url=anterior;

 -- Preservar a visita mais recente, inclusive se a nova URL já possuir histórico.
 INSERT INTO kb_leituras(usuario_id,artigo_url,acessado_em)
 SELECT usuario_id,atual,acessado_em FROM kb_leituras WHERE artigo_url=anterior
 ON CONFLICT(usuario_id,artigo_url) DO UPDATE
  SET acessado_em=GREATEST(kb_leituras.acessado_em,EXCLUDED.acessado_em);
 DELETE FROM kb_leituras WHERE artigo_url=anterior;

 -- Em feedback duplicado, a decisão mais recente prevalece.
 INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu,criado_em,atualizado_em)
 SELECT usuario_id,atual,resolveu,criado_em,atualizado_em
 FROM kb_artigo_feedback WHERE artigo_url=anterior
 ON CONFLICT(usuario_id,artigo_url) DO UPDATE
  SET resolveu=CASE WHEN kb_artigo_feedback.atualizado_em>=EXCLUDED.atualizado_em
       THEN kb_artigo_feedback.resolveu ELSE EXCLUDED.resolveu END,
      criado_em=LEAST(kb_artigo_feedback.criado_em,EXCLUDED.criado_em),
      atualizado_em=GREATEST(kb_artigo_feedback.atualizado_em,EXCLUDED.atualizado_em);
 DELETE FROM kb_artigo_feedback WHERE artigo_url=anterior;
 RETURN NEW;
END $migrar_url$;

DROP TRIGGER IF EXISTS kb_artigos_validar_url ON kb_artigos;
CREATE TRIGGER kb_artigos_validar_url
 BEFORE INSERT OR UPDATE OF categoria,slug ON kb_artigos
 FOR EACH ROW EXECUTE FUNCTION kb_validar_url_artigo();

DROP TRIGGER IF EXISTS kb_artigos_migrar_url ON kb_artigos;
CREATE TRIGGER kb_artigos_migrar_url
 AFTER UPDATE OF categoria,slug ON kb_artigos
 FOR EACH ROW WHEN (OLD.categoria IS DISTINCT FROM NEW.categoria OR OLD.slug IS DISTINCT FROM NEW.slug)
 EXECUTE FUNCTION kb_migrar_url_artigo();

COMMIT;
