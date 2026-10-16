import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const obrigatorios = [
  "package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs", ".env.example",
  "src/proxy.ts", "src/app/layout.tsx", 
  "src/app/page.tsx", "src/app/busca/page.tsx",
  "src/app/artigos/[categoria]/[slug]/page.tsx",
  "src/app/entrar/page.tsx", "src/app/robots.ts",
  "src/app/api/autenticacao/entrar/route.ts", "src/app/api/autenticacao/sair/route.ts",
  "src/lib/sessao.ts", "src/lib/usuarios.ts", "src/lib/autenticacao-servidor.ts",
  "scripts/db-usuarios.mjs", "scripts/testar-usuarios.ts", "scripts/testar-banco.mjs", "db/001_auth.sql", "db/002_painel.sql", "src/lib/banco.ts",
  "src/app/admin/page.tsx", "src/app/admin/usuarios/page.tsx", "src/app/admin/artigos/page.tsx",
  "src/app/api/admin/usuarios/route.ts", "src/app/api/admin/artigos/route.ts",
  "src/components/painel-busca.tsx", "src/lib/indice-busca.ts", "src/lib/busca.ts",
  "scripts/verificar-dados-sensiveis.mjs", "scripts/testar-seguranca.ts",
];
let erros = 0;
for (const caminho of obrigatorios) {
  if (!existsSync(resolve(caminho))) { console.error(`[FALTA] ${caminho}`); erros++; }
  else console.log(`[OK] ${caminho}`);
}
const json = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
for (const pacote of ["next", "react", "react-dom", "fuse.js", "@neondatabase/serverless"]) {
  if (!json.dependencies?.[pacote]) { console.error(`[FALTA] dependência: ${pacote}`); erros++; }
}
if (erros) { console.error(`Estrutura incompleta: ${erros} problema(s).`); process.exitCode = 1; }
else console.log("Estrutura da Fase 6 conferida. Execute lint e build para validação final.");
