import assert from "node:assert/strict";
import { detectarDadosSensiveis } from "./lib/dados-sensiveis.mjs";
import { autenticacaoConfigurada, destinoSeguro, opcoesCookie } from "../src/lib/sessao";
import { origemPostValida, verificarOrigemPost } from "../src/lib/origem";
const anterior = process.env.DATABASE_URL;
try {
  delete process.env.DATABASE_URL;
  assert.equal(autenticacaoConfigurada(), false);
  assert.equal(opcoesCookie().sameSite, "strict");
  assert.equal(opcoesCookie().httpOnly, true);
  assert.equal(destinoSeguro("//externo/"), "/");
  assert.equal(destinoSeguro("/busca?q=erro"), "/busca?q=erro");
  const local = new Headers({ host: "localhost:3000", origin: "http://localhost:3000", "sec-fetch-site": "same-origin" });
  assert.equal(origemPostValida(local), true);
  assert.equal(origemPostValida(new Headers({ host: "localhost:3000", origin: "null" })), false);
  assert.equal(origemPostValida(new Headers({ host: "localhost:3000", origin: "https://site-externo.test" })), false);
  assert.equal(origemPostValida(new Headers({ host: "localhost:3000", origin: "http://localhost:3000", "sec-fetch-site": "cross-site" })), false);
  assert.equal(origemPostValida(new Headers({ host: "localhost:3000", "sec-fetch-site": "same-origin" })), true);
  assert.equal(verificarOrigemPost(new Headers({ host: "localhost:3000" })).valida, false);
  const email = "usuario" + "@" + "empresa.test";
  assert.ok(detectarDadosSensiveis(email).some(e => e.tipo === "e-mail"));
  console.log("✅ Testes de origem, cookies, redirecionamento e auditoria de conteúdo passaram.");
} finally {
  if (anterior === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = anterior;
}
