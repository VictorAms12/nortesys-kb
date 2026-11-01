-- Fase 2: reconciliar a migração 009 quando seu gatilho de fila estiver ausente.
-- Aditiva/idempotente; não remove mensagens nem blobs. Aplicar primeiro no Neon DEV.
BEGIN;

CREATE OR REPLACE FUNCTION kb_registrar_imagem_chat_excluida()
RETURNS TRIGGER LANGUAGE plpgsql AS $chat_img$
BEGIN
 IF NEW.apagada_para_todos_em IS NOT NULL
    AND OLD.apagada_para_todos_em IS NULL
    AND NEW.imagem_caminho IS NOT NULL THEN
   INSERT INTO kb_chat_imagens_limpeza(caminho,mensagem_id)
   VALUES (NEW.imagem_caminho,NEW.id)
   ON CONFLICT(caminho) DO NOTHING;
 END IF;
 RETURN NEW;
END $chat_img$;

-- Não substitui gatilhos já instalados; recupera somente os que faltam.
DO $repor_gatilho$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgrelid='kb_chat_mensagens'::regclass
    AND tgname='kb_chat_imagem_exclusao_global' AND NOT tgisinternal
 ) THEN
  CREATE TRIGGER kb_chat_imagem_exclusao_global
   AFTER UPDATE OF apagada_para_todos_em ON kb_chat_mensagens
   FOR EACH ROW EXECUTE FUNCTION kb_registrar_imagem_chat_excluida();
 END IF;
END $repor_gatilho$;

-- Reconstitui exclusivamente pedidos de limpeza para mensagens removidas PARA TODOS.
INSERT INTO kb_chat_imagens_limpeza(caminho,mensagem_id)
 SELECT imagem_caminho,id
 FROM kb_chat_mensagens
 WHERE apagada_para_todos_em IS NOT NULL AND imagem_caminho IS NOT NULL
 ON CONFLICT(caminho) DO NOTHING;

COMMIT;
