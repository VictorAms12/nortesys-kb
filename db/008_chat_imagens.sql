-- 008: imagens privadas no chat, associadas às mensagens existentes.
-- Aplicar em DESENVOLVIMENTO/PREVIEW antes de testar; produção apenas após aprovação.
-- Idempotente, não remove mensagens nem altera permissões anteriores.
BEGIN;
ALTER TABLE kb_chat_mensagens ADD COLUMN IF NOT EXISTS imagem_caminho TEXT;
ALTER TABLE kb_chat_mensagens ADD COLUMN IF NOT EXISTS imagem_mime TEXT;
ALTER TABLE kb_chat_mensagens ADD COLUMN IF NOT EXISTS imagem_tamanho INTEGER;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='kb_chat_imagem_valida') THEN
    ALTER TABLE kb_chat_mensagens ADD CONSTRAINT kb_chat_imagem_valida CHECK (
      (imagem_caminho IS NULL AND imagem_mime IS NULL AND imagem_tamanho IS NULL)
      OR
      (imagem_caminho ~ '^kb-chat-imagens/[0-9a-f-]{36}\.(png|jpg|webp)$'
       AND imagem_mime IN ('image/png','image/jpeg','image/webp')
       AND imagem_tamanho BETWEEN 1 AND 2097152)
    );
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS kb_chat_imagem_caminho_unique
  ON kb_chat_mensagens (imagem_caminho) WHERE imagem_caminho IS NOT NULL;
COMMIT;
