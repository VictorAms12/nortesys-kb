-- Fase 7B: favoritos e artigos recentes individuais; URLs não expõem dados pessoais.
CREATE TABLE IF NOT EXISTS kb_favoritos (
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  artigo_url VARCHAR(300) NOT NULL CHECK (artigo_url ~ '^/artigos/[a-z0-9-]+/[a-z0-9-]+$'),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, artigo_url)
);
CREATE INDEX IF NOT EXISTS kb_favoritos_usuario_data_idx ON kb_favoritos(usuario_id, criado_em DESC);
CREATE TABLE IF NOT EXISTS kb_leituras (
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  artigo_url VARCHAR(300) NOT NULL CHECK (artigo_url ~ '^/artigos/[a-z0-9-]+/[a-z0-9-]+$'),
  acessado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, artigo_url)
);
CREATE INDEX IF NOT EXISTS kb_leituras_usuario_data_idx ON kb_leituras(usuario_id, acessado_em DESC);
