import { spawnSync } from "node:child_process";

const ambiente = { ...process.env };
for (const chave of Object.keys(ambiente)) {
  if (/^(DATABASE_URL|POSTGRES.*|PG.*|BLOB_.*|VERCEL_.*|NEXT_PUBLIC_.*|NODE_OPTIONS)$/.test(chave)) delete ambiente[chave];
}
const tarefas = [
  ["scripts/verificar-estrutura.mjs"],
  ["scripts/verificar-documentacao.mjs"],
  ["scripts/verificar-dados-sensiveis.mjs"],
  ["node_modules/tsx/dist/cli.mjs", "scripts/validar-artigos.ts"],
  ...["testar-validacao", "testar-busca", "testar-seguranca", "testar-usuarios", "testar-fase6",
    "testar-hidratacao-imagens"].map(nome => ["node_modules/tsx/dist/cli.mjs", `tests/${nome}.ts`]),
  ...["testar-banco", "testar-fase7a", "testar-fase7b", "testar-login-unificado", "testar-login-visual", "testar-chat-layout", "testar-chat-viewport"].map(nome => [`tests/${nome}.mjs`]),
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-imagens.ts", "tests/testar-revisao.ts", "tests/testar-anexos.ts", "tests/testar-ferramentas.ts", "tests/testar-chat.ts", "tests/testar-chat-acoes.ts", "tests/testar-chat-imagens.ts", "tests/testar-chat-clipboard.ts", "tests/testar-fases-7h-7j.ts", "tests/testar-fase8.ts"],
  ["node_modules/eslint/bin/eslint.js", "."],
  ["node_modules/next/dist/bin/next", "typegen"],
  ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"],
];
for (const args of tarefas) {
  console.log(`Validando: ${args.join(" ")}`);
  const resultado = spawnSync(process.execPath, args, { env: ambiente, stdio: "inherit" });
  if (resultado.error) { console.error(resultado.error.message); process.exit(1); }
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}
console.log("Revisão local concluída. Gere o build isolado com npm run build:revisao.");
