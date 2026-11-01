import { spawnSync } from "node:child_process";

const ambiente = { ...process.env };
for (const chave of Object.keys(ambiente)) {
  if (/^(DATABASE_URL|POSTGRES.*|PG.*|BLOB_.*|VERCEL_.*|NEXT_PUBLIC_.*|NODE_OPTIONS)$/.test(chave)) delete ambiente[chave];
}
const tarefas = [
  ["scripts/verificar-estrutura.mjs"],
  ["scripts/verificar-documentacao.mjs"],
  ["scripts/verificar-dados-sensiveis.mjs"],
  ["tests/testar-migracoes.mjs"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-migracoes-estado.mjs"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-busca-postgres.mjs"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-corpo-limitado.ts"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-admin-seguranca.ts"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-integridade-artigos.ts"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-cache-artigos.ts"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-manutencao-lotes.ts"],
  ["node_modules/tsx/dist/cli.mjs", "scripts/validar-artigos.ts"],
  ...["testar-validacao", "testar-busca", "testar-seguranca", "testar-usuarios", "testar-fase6",
    "testar-hidratacao-imagens"].map(nome => ["node_modules/tsx/dist/cli.mjs", `tests/${nome}.ts`]),
  // Os antigos testes de leitura de CSS/JSX foram substituídos por smoke tests de navegador.
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/testar-imagens.ts", "tests/testar-revisao.ts", "tests/testar-anexos.ts", "tests/testar-ferramentas.ts", "tests/testar-chat.ts", "tests/testar-chat-acoes.ts", "tests/testar-chat-imagens.ts", "tests/testar-chat-clipboard.ts", "tests/testar-fases-7h-7j.ts", "tests/testar-fase8.ts"],
  ["node_modules/eslint/bin/eslint.js", "."],
  ["node_modules/next/dist/bin/next", "typegen"],
  ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"],
];
const somenteRegras = process.argv.includes("--regras");
const execucoes = somenteRegras ? tarefas.slice(0, -3) : tarefas;
for (const args of execucoes) {
  console.log(`Validando: ${args.join(" ")}`);
  const resultado = spawnSync(process.execPath, args, { env: ambiente, stdio: "inherit" });
  if (resultado.error) { console.error(resultado.error.message); process.exit(1); }
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}
console.log(somenteRegras ? "Testes de regras e integrações concluídos." : "Revisão local concluída. Gere o build isolado com npm run build:revisao.");
