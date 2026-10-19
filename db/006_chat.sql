-- 7G.1 / 7G.2: chat privado + geral, presença aproximada, leitura e limites.
-- Aplicar integralmente no Neon de DESENVOLVIMENTO antes de testar o Preview.
-- Idempotente, não remove contas, artigos, auditoria nem dados anteriores.
BEGIN;
CREATE TABLE IF NOT EXISTS kb_chat_conversas(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(12) NOT NULL CHECK(tipo IN ('geral','privada')),
  chave VARCHAR(100) NOT NULL UNIQUE,
  criado_por UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS kb_chat_participantes(
  conversa_id UUID NOT NULL REFERENCES kb_chat_conversas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  ultima_lida_id BIGINT NOT NULL DEFAULT 0 CHECK(ultima_lida_id>=0),
  PRIMARY KEY(conversa_id,usuario_id)
);
CREATE INDEX IF NOT EXISTS kb_chat_participantes_usuario_idx ON kb_chat_participantes(usuario_id);
CREATE TABLE IF NOT EXISTS kb_chat_mensagens(
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES kb_chat_conversas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE RESTRICT,
  texto VARCHAR(2000) NOT NULL CHECK(char_length(trim(texto)) BETWEEN 1 AND 2000),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kb_chat_mensagens_conversa_idx ON kb_chat_mensagens(conversa_id,id DESC);
CREATE TABLE IF NOT EXISTS kb_chat_presenca(
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  visto_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS kb_chat_limites(
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  inicio_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantidade INTEGER NOT NULL CHECK(quantidade BETWEEN 1 AND 15)
);
CREATE TABLE IF NOT EXISTS kb_chat_digitacao_limites(
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  ultimo_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kb_auditoria_usuario_data_idx ON kb_auditoria(usuario_id,data DESC);
CREATE INDEX IF NOT EXISTS kb_auditoria_evento_data_idx ON kb_auditoria(evento,data DESC);
INSERT INTO kb_chat_conversas(id,tipo,chave)
VALUES ('00000000-0000-4000-8000-000000000001','geral','geral')
ON CONFLICT(chave) DO NOTHING;
COMMIT;
