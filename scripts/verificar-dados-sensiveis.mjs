import { resolve } from "node:path";
import { listarOcorrencias } from "./lib/dados-sensiveis.mjs";

const raiz = resolve(process.cwd());
const encontrados = listarOcorrencias(raiz);
if (encontrados.length) {
  console.error(`
⛔ Verificação bloqueada: ${encontrados.length} possível(is) dado(s) sensível(is).`);
  for (const { arquivo, linha, tipo } of encontrados) console.error(`  ${arquivo}:${linha} — ${tipo}`);
  console.error("Remova/substitua por dados fictícios. O scanner é preventivo, não substitui revisão humana.");
  process.exitCode = 1;
} else {
  console.log("✅ Verificação de dados sensíveis: nenhum padrão suspeito encontrado.");
}
