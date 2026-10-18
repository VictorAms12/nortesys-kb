import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve, relative, isAbsolute, join } from "node:path";
import { existsSync } from "node:fs";

const raiz = resolve("build");
const destino = resolve(process.argv[2] ?? "build/inexistente");
const relativo = relative(raiz, destino);
assert.ok(relativo && !relativo.startsWith("..") && !isAbsolute(relativo), "Informe uma cópia em build/");
assert.ok(existsSync(join(destino, ".next", "BUILD_ID")), "Build incompleto");
const reserva = createServer();
await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
const porta = reserva.address().port;
await new Promise(resolve => reserva.close(resolve));
const ambiente = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
for (const chave of Object.keys(ambiente)) {
  if (/^(DATABASE_URL|POSTGRES.*|PG.*|BLOB_.*|VERCEL_.*|NEXT_PUBLIC_.*|NODE_OPTIONS|NODE_ENV)$/.test(chave)) delete ambiente[chave];
}
const servidor = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(porta)],
  { cwd: destino, env: ambiente, stdio: ["ignore", "pipe", "pipe"] });
let saida = "";
servidor.stdout.on("data", dados => { saida += dados; });
servidor.stderr.on("data", dados => { saida += dados; });
const base = `http://127.0.0.1:${porta}`;
try {
  let login;
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    try { login = await fetch(`${base}/entrar`, { signal: AbortSignal.timeout(3000) }); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  assert.ok(login, saida);
  assert.equal(login.status, 200);
  const html = await login.text();
  assert.match(html, /Bem-vindo de volta/);
  assert.match(html, /Acesso indisponível/); // Sem DATABASE_URL no snapshot.
  assert.equal(login.headers.get("x-frame-options"), "DENY");
  assert.match(login.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  const imagem = await fetch(`${base}/api/imagens/00000000-0000-4000-8000-000000000000`);
  assert.equal(imagem.status, 401);
  assert.match(imagem.headers.get("cache-control") ?? "", /no-store/);
  const upload = await fetch(`${base}/api/admin/imagens`, { method: "POST", headers: { origin: base }, body: new FormData() });
  assert.equal(upload.status, 401);
  const css = html.match(/href="([^"<>]+\.css[^"<>]*)"/);
  assert.ok(css, "CSS do build ausente");
  assert.equal((await fetch(new URL(css[1].replaceAll("&amp;", "&"), base))).status, 200);
  console.log("Build HTTP: login, CSS, cabeçalhos e bloqueios anônimos de imagens validados sem banco real.");
} finally {
  servidor.kill();
}
