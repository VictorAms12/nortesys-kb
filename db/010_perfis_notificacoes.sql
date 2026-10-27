-- Fase 8D/8C: perfil opcional, preferencias de alertas e caixa de notificacoes.
-- Migration aditiva, idempotente; aplicar somente no banco escolhido para Preview.
BEGIN;
ALTER TABLE kb_usuarios ADD COLUMN IF NOT EXISTS bio VARCHAR(240);
ALTER TABLE kb_usuarios ADD COLUMN IF NOT EXISTS avatar_caminho VARCHAR(240);
ALTER TABLE kb_usuarios ADD COLUMN IF NOT EXISTS preferencias_notificacoes JSONB NOT NULL
  DEFAULT '{"avisos":true,"navegador":false,"geral":true}'::jsonb;
CREATE TABLE IF NOT EXISTS kb_notificacoes (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 destinatario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
 autor_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
 conversa_id UUID NOT NULL REFERENCES kb_chat_conversas(id) ON DELETE CASCADE,
 mensagem_id BIGINT NOT NULL REFERENCES kb_chat_mensagens(id) ON DELETE CASCADE,
 criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 vista_em TIMESTAMPTZ,
 UNIQUE(destinatario_id,mensagem_id)
);
CREATE INDEX IF NOT EXISTS kb_notificacoes_destino_idx
 ON kb_notificacoes(destinatario_id,criada_em DESC);
CREATE OR REPLACE FUNCTION kb_criar_notificacoes_chat() RETURNS TRIGGER
 LANGUAGE plpgsql AS $fase8$
BEGIN
 INSERT INTO kb_notificacoes(destinatario_id,autor_id,conversa_id,mensagem_id)
 SELECT p.usuario_id,NEW.autor_id,NEW.conversa_id,NEW.id
 FROM kb_chat_participantes p
 JOIN kb_usuarios u ON u.id=p.usuario_id AND u.ativo=true
 WHERE p.conversa_id=NEW.conversa_id AND p.usuario_id<>NEW.autor_id
 ON CONFLICT (destinatario_id,mensagem_id) DO NOTHING;
 RETURN NEW;
END $fase8$;
DO $fase8_trigger$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='kb_chat_mensagens'::regclass
   AND tgname='kb_chat_notificacoes_fase8') THEN
  CREATE TRIGGER kb_chat_notificacoes_fase8
  AFTER INSERT ON kb_chat_mensagens
  FOR EACH ROW EXECUTE FUNCTION kb_criar_notificacoes_chat();
 END IF;
END $fase8_trigger$;
-- Inscrições de push autenticadas, somente endpoints de serviços conhecidos.
-- As notificações externas não enviam o corpo de mensagens nem dados do cliente.
CREATE TABLE IF NOT EXISTS kb_push_subscricoes (
 usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
 endpoint_hash CHAR(64) NOT NULL CHECK (endpoint_hash ~ '^[0-9a-f]{64}
),
 endpoint TEXT NOT NULL CHECK (length(endpoint) BETWEEN 50 AND 2000),
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(usuario_id,endpoint_hash)
);
CREATE INDEX IF NOT EXISTS kb_push_subscricoes_usuario_idx ON kb_push_subscricoes(usuario_id);
COMMIT;
