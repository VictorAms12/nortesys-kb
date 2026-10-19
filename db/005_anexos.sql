-- Fase 7C.2: anexos PDF privados vinculados a artigos. Aplicar manualmente no Neon de testes antes de validar a branch.
-- Não apaga nem altera dados existentes.
BEGIN;
CREATE TABLE IF NOT EXISTS kb_anexos (
  id UUID PRIMARY KEY,
  artigo_id UUID NOT NULL REFERENCES kb_artigos(id) ON DELETE RESTRICT,
  usuario_id UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  blob_caminho TEXT NOT NULL UNIQUE CHECK (blob_caminho ~ '^kb-anexos/[0-9a-f-]{36}\.pdf$'),
  nome VARCHAR(160) NOT NULL CHECK (char_length(nome) BETWEEN 5 AND 160),
  mime VARCHAR(32) NOT NULL DEFAULT 'application/pdf' CHECK (mime = 'application/pdf'),
  tamanho INTEGER NOT NULL CHECK (tamanho BETWEEN 1 AND 3145728),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'pronta', 'falhou', 'limpeza_pendente', 'removido')),
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (blob_caminho = 'kb-anexos/' || id::text || '.pdf')
);
CREATE INDEX IF NOT EXISTS kb_anexos_artigo_idx ON kb_anexos(artigo_id, enviado_em DESC);
CREATE INDEX IF NOT EXISTS kb_anexos_limpeza_idx ON kb_anexos(enviado_em) WHERE estado <> 'pronta';
CREATE TABLE IF NOT EXISTS kb_anexo_limites (
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  janela_em TIMESTAMPTZ NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 12)
);
COMMIT;
