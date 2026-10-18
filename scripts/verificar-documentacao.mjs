import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function documentos(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap(item => {
    if (item.name === "historico") return [];
    const caminho = join(pasta, item.name);
    return item.isDirectory() ? documentos(caminho) : item.name.endsWith(".md") ? [caminho] : [];
  });
}

let erros = 0;
function conferir(origem, alvo) {
  if (/^(?:[a-z]+:|#)/i.test(alvo)) return;
  const arquivo = decodeURIComponent(alvo.split("#")[0]);
  if (arquivo && !existsSync(resolve(dirname(origem), arquivo))) {
    console.error(`Link local ausente: ${origem} -> ${alvo}`);
    erros++;
  }
}
for (const arquivo of ["README.md", "CONTRIBUINDO.md", ...documentos("docs")]) {
  const texto = readFileSync(arquivo, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const link of texto.matchAll(/\]\(([^\s)]+)\)|(?:href|src)="([^"]+)"/g)) {
    conferir(arquivo, link[1] ?? link[2]);
  }
}
const pacote = JSON.parse(readFileSync("package.json", "utf8"));
for (const [nome, comando] of Object.entries(pacote.scripts)) {
  for (const arquivo of comando.matchAll(/(?:scripts|tests)\/[\w./-]+\.(?:mjs|ts)\b/g)) {
    if (!existsSync(arquivo[0])) {
      console.error(`Comando ${nome}: arquivo ausente ${arquivo[0]}`);
      erros++;
    }
  }
}
if (erros) process.exitCode = 1;
else console.log("Links da documentação atual e caminhos dos comandos conferidos.");
