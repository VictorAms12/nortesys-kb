-- 018: marca apenas o hash do IP de logins bem-sucedidos. Não registra IP completo.
CREATE TABLE IF NOT EXISTS kb_login_ips_confiaveis (
 usuario_id UUID NOT NULL REFERENCES kb_usuarios(id) ON DELETE CASCADE,
 ip_hash CHAR(64) NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
 ultimo_sucesso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(usuario_id,ip_hash)
);
CREATE INDEX IF NOT EXISTS kb_login_ips_confiaveis_data_idx ON kb_login_ips_confiaveis(ultimo_sucesso);
