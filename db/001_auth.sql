-- Fase 5.5: usuários, sessões revogáveis e limite compartilhado de tentativas.
-- Execução idempotente: npm run db:migrar (via CLI do projeto).
CREATE TABLE IF NOT EXISTS kb_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario VARCHAR(40) NOT NULL UNIQUE CHECK (usuario ~ '^[a-z][a-z0-9._-]{2,39}$'),
  nome VARCHAR(80) NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 80),
  papel VARCHAR(20) NOT NULL DEFAULT 'leitor' CHECK (papel IN ('administrador','editor','leitor')),
  senha_salt CHAR(32) NOT NULL CHECK (senha_salt ~ '^[0-9a-f]{32}$'),
  senha_hash CHAR(128) NOT NULL CHECK (senha_hash ~ '^[0-9a-f]{128}$'),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  versao_sessao INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS kb_sessoes (
  token_hash CHAR(64) PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  versao_sessao INTEGER NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS kb_sessoes_usuario_id_idx ON kb_sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS kb_sessoes_expira_em_idx ON kb_sessoes(expira_em);
CREATE TABLE IF NOT EXISTS kb_login_tentativas (
  chave VARCHAR(60) PRIMARY KEY,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  expira_em TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS kb_login_tentativas_expira_idx ON kb_login_tentativas(expira_em);
