-- Fase 8C: preferências de alertas por conversa, exclusivas de cada participante.
-- Aditiva e idempotente: somente Preview nesta etapa.
BEGIN;
ALTER TABLE kb_chat_participantes ADD COLUMN IF NOT EXISTS silenciada BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS kb_chat_participantes_alertas_idx
 ON kb_chat_participantes(usuario_id,conversa_id) WHERE silenciada=FALSE;
COMMIT;
