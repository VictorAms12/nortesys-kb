-- Fases 7H/7J: fila de limpeza de imagens e indicadores anônimos + feedback de artigos.
-- Aplicar no banco de Preview, depois no de Production antes do novo código.
-- Exige 001-008; transação aditiva e idempotente, sem excluir dados anteriores.
BEGIN;
CREATE TABLE IF NOT EXISTS kb_artigo_feedback (
  usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  artigo_url VARCHAR(300) NOT NULL CHECK (artigo_url ~ '^/artigos/[a-z0-9-]+/[a-z0-9-]+$'),
  resolveu BOOLEAN NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, artigo_url)
);
CREATE INDEX IF NOT EXISTS kb_artigo_feedback_artigo_idx ON kb_artigo_feedback(artigo_url);

-- Lacunas de busca: somente termos que passam em validação restrita, sem conta/IP.
CREATE TABLE IF NOT EXISTS kb_buscas_sem_resultado (
  termo VARCHAR(90) NOT NULL,
  dia DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  PRIMARY KEY (termo, dia)
);
CREATE INDEX IF NOT EXISTS kb_buscas_sem_resultado_dia_idx ON kb_buscas_sem_resultado(dia DESC);
CREATE TABLE IF NOT EXISTS kb_busca_estatistica_limites (
  usuario_id UUID PRIMARY KEY REFERENCES kb_usuarios(id) ON DELETE CASCADE,
  ultima_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Somente mensagens apagadas PARA TODOS entram nesta fila.
-- Limpar uma conversa ou ocultar para si NÃO destrói imagens dos demais.
CREATE TABLE IF NOT EXISTS kb_chat_imagens_limpeza (
  caminho VARCHAR(180) PRIMARY KEY CHECK (caminho ~ '^kb-chat-imagens/[0-9a-f-]{36}\.(png|jpg|webp)$'),
  mensagem_id BIGINT REFERENCES kb_chat_mensagens(id) ON DELETE SET NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reservada_ate TIMESTAMPTZ,
  tentativas INTEGER NOT NULL DEFAULT 0 CHECK (tentativas >= 0)
);
CREATE INDEX IF NOT EXISTS kb_chat_imagens_limpeza_disponiveis_idx
  ON kb_chat_imagens_limpeza(criada_em) WHERE reservada_ate IS NULL;
COMMIT;
