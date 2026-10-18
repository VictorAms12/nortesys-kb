import { cpSync, mkdirSync, symlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

// Snapshot sem .env, credenciais, uploads locais ou conexão com o banco real.
const raiz = process.cwd();
const destino = resolve(raiz, "build", `revisao-${Date.now()}`);
mkdirSync(destino, { recursive: true });
for (const nome of ["src", "config", "content", "db", "scripts", "tests", "public",
  "package.json", "package-lock.json", "next.config.ts", "tsconfig.json",
  "postcss.config.mjs", "eslint.config.mjs", ".gitignore", ".env.example"]) {
  cpSync(join(raiz, nome), join(destino, nome), {
    recursive: true,
    filter: caminho => !caminho.replaceAll("\\", "/").includes("/uploads-locais"),
  });
}
symlinkSync(join(raiz, "node_modules"), join(destino, "node_modules"), "junction");
const ambiente = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
for (const chave of Object.keys(ambiente)) {
  if (/^(DATABASE_URL|POSTGRES.*|PG.*|BLOB_.*|VERCEL_.*|NEXT_PUBLIC_.*|NODE_OPTIONS|NODE_ENV)$/.test(chave)) delete ambiente[chave];
}
console.log(`Build de revisão isolado: ${destino}`);
// Webpack aceita dependências compartilhadas por junction no Windows.
const tarefas = [
  ["node_modules/tsx/dist/cli.mjs", "scripts/validar-artigos.ts"],
  ["scripts/verificar-dados-sensiveis.mjs"],
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
];
for (const argumentos of tarefas) {
  const resultado = spawnSync(process.execPath, argumentos, { cwd: destino, env: ambiente, stdio: "inherit" });
  if (resultado.error) { console.error(resultado.error.message); process.exit(1); }
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}
