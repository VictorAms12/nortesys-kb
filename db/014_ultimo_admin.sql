-- Fase 1 de segurança: não permitir remover o último administrador ativo,
-- mesmo quando duas requisições simultâneas modificam administradores diferentes.
-- Aditiva/idempotente; executar somente no Neon de desenvolvimento antes de produção.
BEGIN;

CREATE OR REPLACE FUNCTION kb_proteger_ultimo_admin()
RETURNS TRIGGER LANGUAGE plpgsql AS $seguranca_admin$
DECLARE
  saindo BOOLEAN := FALSE;
BEGIN
  IF OLD.papel = 'administrador' AND OLD.ativo = TRUE THEN
    IF TG_OP = 'DELETE' THEN
      saindo := TRUE;
    ELSIF NEW.papel <> 'administrador' OR NEW.ativo IS NOT TRUE THEN
      saindo := TRUE;
    END IF;
  END IF;

  IF saindo THEN
    -- Serializa as operações capazes de remover administradores ativos.
    -- A consulta seguinte roda após obter o lock, vendo commits anteriores.
    PERFORM pg_advisory_xact_lock(147821);
    IF NOT EXISTS (
      SELECT 1 FROM kb_usuarios
      WHERE id <> OLD.id AND papel = 'administrador' AND ativo = TRUE
    ) THEN
      RAISE EXCEPTION 'O último administrador ativo deve ser preservado'
        USING ERRCODE = '23514', CONSTRAINT = 'kb_ultimo_admin';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$seguranca_admin$;

DROP TRIGGER IF EXISTS kb_usuarios_proteger_ultimo_admin ON kb_usuarios;
CREATE TRIGGER kb_usuarios_proteger_ultimo_admin
  BEFORE UPDATE OF papel, ativo OR DELETE ON kb_usuarios
  FOR EACH ROW EXECUTE FUNCTION kb_proteger_ultimo_admin();

COMMIT;
