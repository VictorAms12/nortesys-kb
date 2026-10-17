-- Fase 7C.1. Aplicar MANUALMENTE, depois de 001-003, no banco escolhido.
-- Arquivo completo em uma transação; NÃO usar o splitter de scripts/db-usuarios.mjs.
BEGIN;

CREATE TABLE IF NOT EXISTS kb_imagens (
  id UUID PRIMARY KEY,
  blob_caminho TEXT NOT NULL UNIQUE CHECK (blob_caminho ~ '^kb-imagens/[0-9a-f-]{36}\.(png|jpg|webp)$'),
  mime VARCHAR(20) NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp')),
  tamanho INTEGER NOT NULL CHECK (tamanho BETWEEN 1 AND 2097152),
  largura INTEGER NOT NULL CHECK (largura > 0),
  altura INTEGER NOT NULL CHECK (altura > 0),
  descricao VARCHAR(90) NOT NULL,
  usuario_id UUID REFERENCES kb_usuarios(id) ON DELETE SET NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  artigo_id UUID REFERENCES kb_artigos(id) ON DELETE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (estado IN ('pendente','pronta','falhou','limpeza_pendente')),
  CHECK (blob_caminho = 'kb-imagens/' || id::text || '.' || CASE mime
    WHEN 'image/png' THEN 'png' WHEN 'image/jpeg' THEN 'jpg' WHEN 'image/webp' THEN 'webp' END)
);
CREATE INDEX IF NOT EXISTS kb_imagens_artigo_idx ON kb_imagens(artigo_id);
CREATE INDEX IF NOT EXISTS kb_imagens_usuario_data_idx ON kb_imagens(usuario_id, enviado_em DESC);
CREATE INDEX IF NOT EXISTS kb_imagens_reconciliar_idx ON kb_imagens(enviado_em) WHERE estado <> 'pronta';

CREATE TABLE IF NOT EXISTS kb_imagem_limites (
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  janela_em TIMESTAMPTZ NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 20)
);

-- O vínculo é exclusivo e permanente: remover uma imagem do texto não destrói seu histórico.
-- Executa na MESMA transação da edição e da versão existente; falha reverte tudo.
CREATE OR REPLACE FUNCTION kb_associar_imagens_artigo() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  imagem_id UUID;
  imagem kb_imagens%ROWTYPE;
BEGIN
  FOR imagem_id IN
    SELECT DISTINCT lower(resultado.grupos[1])::uuid
    FROM regexp_matches(
      NEW.conteudo,
      '/api/imagens/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?![0-9a-fA-F-])',
      'g'
    ) AS resultado(grupos)
    ORDER BY 1
  LOOP
    SELECT * INTO imagem FROM kb_imagens WHERE id = imagem_id FOR UPDATE;
    IF NOT FOUND OR imagem.estado <> 'pronta' OR
       (imagem.artigo_id IS NOT NULL AND imagem.artigo_id <> NEW.id) OR
       (imagem.artigo_id IS NULL AND (imagem.usuario_id IS NULL OR NEW.atualizado_por IS NULL OR imagem.usuario_id <> NEW.atualizado_por)) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', CONSTRAINT = 'kb_imagens_referencia',
        MESSAGE = 'Referência de imagem indisponível ou pertencente a outro artigo/usuário';
    END IF;
    IF imagem.artigo_id IS NULL THEN
      UPDATE kb_imagens SET artigo_id = NEW.id WHERE id = imagem_id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kb_artigos_associar_imagens ON kb_artigos;
CREATE TRIGGER kb_artigos_associar_imagens
  AFTER INSERT OR UPDATE OF conteudo ON kb_artigos
  FOR EACH ROW EXECUTE FUNCTION kb_associar_imagens_artigo();

COMMIT;
