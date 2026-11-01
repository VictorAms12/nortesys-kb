/** Verificacao de higiene independente do ESLint e do TypeScript.
 * O Prettier e opcional (npm run format:prettier), sem dependencia permanente. */
import {readFileSync, existsSync} from "node:fs";

const arquivos=[
  "src/lib/chat-sql.ts",
  "src/lib/chat-sql/conversas.ts",
  "src/lib/chat-sql/mensagens.ts",
  "src/lib/chat-sql/imagens.ts",
  "scripts/verificar-formatacao.mjs",
  ".github/workflows/kb-verificacao.yml",
  ".github/dependabot.yml",
  ".prettierrc.json",
  ".prettierignore",
];
const erros=[];
for(const caminho of arquivos){
 if(!existsSync(caminho)){erros.push(`${caminho}: arquivo ausente`);continue;}
 const conteudo=readFileSync(caminho,"utf8");
 if(conteudo.includes("\r"))erros.push(`${caminho}: use quebras LF`);
 if(conteudo.startsWith("\ufeff"))erros.push(`${caminho}: remova o BOM`);
 if(!conteudo.endsWith("\n")||conteudo.endsWith("\n\n"))erros.push(`${caminho}: use uma quebra final`);
 for(const [i,linha] of conteudo.split("\n").entries()){
  if(/[\t ]+$/.test(linha))erros.push(`${caminho}:${i+1}: espacos no final`);
 }
}
if(erros.length){for(const e of erros)console.error("[FORMATO] "+e);process.exitCode=1;}
else console.log("Formatação básica dos módulos e configurações conferida.");
