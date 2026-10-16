import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const schema=readFileSync("db/001_auth.sql","utf8");
const sessao=readFileSync("src/lib/sessao.ts","utf8");
const login=readFileSync("src/app/api/autenticacao/entrar/route.ts","utf8");
for(const tabela of ["kb_usuarios","kb_sessoes","kb_login_tentativas"])
  assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${tabela}`));
assert.match(schema,/versao_sessao/);
assert.match(sessao,/createHash\("sha256"\)/);
assert.match(login,/registrarTentativa\(chave\)/);
assert.doesNotMatch(login,/KB_USERS/);
console.log("✅ Verificação estática do esquema, sessões revogáveis e limite persistente concluída.");
console.log("ℹ️ Teste integrado com PostgreSQL exige DATABASE_URL real e execução de db:verificar.");
