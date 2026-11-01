-- 019: coluna aditiva para scrypt versionado, preserva acesso a contas legadas.
ALTER TABLE kb_usuarios ADD COLUMN IF NOT EXISTS senha_hash_v2 VARCHAR(190);
