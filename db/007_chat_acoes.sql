-- 7G.3: respostas, ocultação individual, remoção global e limpeza do histórico por usuário.
-- Executar no Neon correto antes de publicar o código. Sem exclusão de dados existentes.
BEGIN;
ALTER TABLE kb_chat_mensagens
  ADD COLUMN IF NOT EXISTS respondendo_a_id BIGINT REFERENCES kb_chat_mensagens(id) ON DELETE SET NULL;
ALTER TABLE kb_chat_mensagens
  ADD COLUMN IF NOT EXISTS apagada_para_todos_em TIMESTAMPTZ;
ALTER TABLE kb_chat_participantes
  ADD COLUMN IF NOT EXISTS limpa_ate_id BIGINT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS kb_chat_mensagens_ocultas (
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  mensagem_id BIGINT NOT NULL REFERENCES kb_chat_mensagens(id) ON DELETE CASCADE,
  ocultada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(usuario_id,mensagem_id)
);
CREATE INDEX IF NOT EXISTS kb_chat_mensagens_resposta_idx
  ON kb_chat_mensagens(respondendo_a_id) WHERE respondendo_a_id IS NOT NULL;
COMMIT;
