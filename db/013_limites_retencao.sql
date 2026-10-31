-- 013: cotas por usuário e índices para retenção de notificações.
-- Adições idempotentes; executar primeiro no Neon de desenvolvimento.
BEGIN;

CREATE TABLE IF NOT EXISTS kb_avatar_limites (
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  janela_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 12)
);

CREATE TABLE IF NOT EXISTS kb_busca_sugestoes_limites (
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  janela_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 90)
);

CREATE INDEX IF NOT EXISTS kb_notificacoes_retencao_idx
  ON kb_notificacoes (criada_em);

CREATE INDEX IF NOT EXISTS kb_notificacoes_nao_lidas_idx
  ON kb_notificacoes (destinatario_id, id DESC)
  WHERE vista_em IS NULL;

COMMIT;
