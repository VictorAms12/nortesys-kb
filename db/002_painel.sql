-- Fase 6: artigos persistentes, histórico e ações administrativas.
-- Aplicar depois de 001_auth.sql. Idempotente e sem apagar registros anteriores.
CREATE TABLE IF NOT EXISTS kb_artigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('rascunho', 'revisado', 'obsoleto')),
  conteudo TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1 CHECK (versao > 0),
  arquivado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  atualizado_por UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kb_artigos_categoria_slug UNIQUE (categoria, slug)
);
CREATE INDEX IF NOT EXISTS kb_artigos_visiveis_idx ON kb_artigos(categoria, status) WHERE arquivado = false;
CREATE TABLE IF NOT EXISTS kb_artigo_versoes (
  artigo_id UUID NOT NULL REFERENCES kb_artigos(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  conteudo TEXT NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('criado', 'editado', 'arquivado')),
  editor_id UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artigo_id, versao)
);
CREATE TABLE IF NOT EXISTS kb_auditoria (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  evento VARCHAR(60) NOT NULL,
  alvo VARCHAR(100) NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kb_auditoria_data_idx ON kb_auditoria(data DESC);
