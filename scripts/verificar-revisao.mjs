import { spawnSync } from "node:child_process";

const ambiente = { ...process.env };
for (const chave of Object.keys(ambiente)) {
  if (/^(DATABASE_URL|POSTGRES.*|PG.*|BLOB_.*|VERCEL_.*|NEXT_PUBLIC_.*|NODE_OPTIONS)$/.test(chave)) delete ambiente[chave];
}
const tarefas = [
  ["scripts/verificar-estrutura.mjs"],
  ["scripts/verificar-dados-sensiveis.mjs"],
  ...["validar-artigos", "testar-validacao", "testar-busca", "testar-seguranca", "testar-usuarios", "testar-fase6",
    "testar-upload-imagens-local", "testar-hidratacao-imagens"].map(nome => ["node_modules/tsx/dist/cli.mjs", `scripts/${nome}.ts`]),
  ...["testar-banco", "testar-fase7a", "testar-fase7b", "testar-login-unificado", "testar-login-visual"].map(nome => [`scripts/${nome}.mjs`]),
  ["node_modules/tsx/dist/cli.mjs", "--test", "scripts/testar-imagens.ts", "scripts/testar-revisao.ts"],
  ["node_modules/eslint/bin/eslint.js", "."],
  ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"],
];
for (const args of tarefas) {
  console.log(`Validando: ${args.join(" ")}`);
  const resultado = spawnSync(process.execPath, args, { env: ambiente, stdio: "inherit" });
  if (resultado.error) { console.error(resultado.error.message); process.exit(1); }
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}
console.log("Revisão local concluída. Gere o build isolado com npm run build:revisao.");
