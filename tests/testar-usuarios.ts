import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { derivarHashSenha, FORMATO_USUARIO } from "../src/lib/usuarios";
import { autenticacaoConfigurada, destinoSeguro, opcoesCookie, papelPermitido, NOME_COOKIE } from "../src/lib/sessao";
import { chaveTentativas } from "../src/lib/limite-login";
async function executarTestes(): Promise<void> {
  const anterior = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    assert.equal(autenticacaoConfigurada(), false);
    assert.equal(FORMATO_USUARIO.test("ana.souza"), true);
    assert.equal(FORMATO_USUARIO.test("Ana"), false);
    assert.equal(chaveTentativas("ana"), "usuario:ana");
    assert.equal(chaveTentativas("!!!!!"), "usuario:invalido");
    assert.equal(papelPermitido("leitor", ["administrador"]), false);
    assert.equal(papelPermitido("editor", ["editor", "administrador"]), true);
    assert.equal(destinoSeguro("https://host.test"), "/");
    assert.equal(destinoSeguro("/busca?q=nota"), "/busca?q=nota");
    assert.equal(opcoesCookie().sameSite, "strict");
    assert.equal(opcoesCookie().httpOnly, true);
    assert.ok(NOME_COOKIE === "nortesys-kb-dev" || NOME_COOKIE.startsWith("__Host-"));
    // Hash compatível com contas migradas da Fase 5 (scrypt com salt individual).
    const senha = "credencial-de-teste-aleatoria-123";
    const salt = randomBytes(16);
    const parametros = { N:1 << 14, r:8, p:1, maxmem:64*1024*1024 };
    const esperado = scryptSync(senha, salt, 64, parametros);
    const derivado = await derivarHashSenha(senha, salt);
    assert.deepEqual(derivado, esperado);
    console.log("✅ Testes locais de validação, papéis, cookies e compatibilidade de hashes passaram.");
    console.log("ℹ️ Banco real, revogação e login HTTP: validar após db:migrar na instância Neon.");
  } finally {
    if (anterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = anterior;
  }
}

executarTestes().catch((erro: unknown) => {
  console.error(erro);
  process.exitCode = 1;
});
