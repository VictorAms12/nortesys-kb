-- 012: imagens sem legenda são válidas; mensagens de texto ainda exigem conteúdo.
-- Aplicar primeiro no Neon de desenvolvimento, antes do Preview.
-- Migração idempotente; não exclui mensagens.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'kb_chat_mensagens'::regclass
      AND conname = 'kb_chat_texto_valido'
  ) THEN
    ALTER TABLE kb_chat_mensagens
      ADD CONSTRAINT kb_chat_texto_valido CHECK (
        char_length(texto) <= 2000
        AND (
          char_length(trim(texto)) >= 1
          OR (imagem_caminho IS NOT NULL AND texto = '')
        )
      );
  END IF;
END $$;

-- A restrição anterior deixa de existir somente após validar a nova.
ALTER TABLE kb_chat_mensagens
  DROP CONSTRAINT IF EXISTS kb_chat_mensagens_texto_check;

-- Substitui apenas a legenda automática de imagens já armazenadas.
UPDATE kb_chat_mensagens
SET texto = ''
WHERE imagem_caminho IS NOT NULL AND texto = '📷 Imagem';

COMMIT;
