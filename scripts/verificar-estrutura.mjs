/** Verifica invariantes e convenções, não nomes de componentes ou textos de JSX. */
import {existsSync, readdirSync, readFileSync} from "node:fs";
import {resolve} from "node:path";

const base=[
  "package.json","package-lock.json","tsconfig.json","next.config.ts",
  "eslint.config.mjs","src/app","src/lib","src/components","src/types",
  "config","content","db","scripts","tests","tests/e2e",
  ".github/workflows/kb-verificacao.yml",".github/dependabot.yml",
  "docs/README.md","docs/guias/configuracao.md","docs/guias/deploy.md",
];
const erros=[];
for(const item of base)if(!existsSync(resolve(item)))erros.push("Caminho essencial ausente: "+item);

if(existsSync("package.json")&&existsSync("package-lock.json")){
 const pacote=JSON.parse(readFileSync("package.json","utf8"));
 const trava=JSON.parse(readFileSync("package-lock.json","utf8"));
 for(const nome of ["next","react","react-dom","fuse.js","@neondatabase/serverless"])
  if(!pacote.dependencies?.[nome])erros.push("Dependência de aplicação ausente: "+nome);
 if(!pacote.devDependencies?.["@playwright/test"])
  erros.push("Playwright deve constar somente em devDependencies.");
 if(pacote.dependencies?.["@playwright/test"])
  erros.push("Playwright não pode entrar no bundle de produção.");
 if(trava.packages?.[""]?.devDependencies?.["@playwright/test"]!==pacote.devDependencies?.["@playwright/test"])
  erros.push("Versão de Playwright difere entre package.json e package-lock.json.");
}
if(existsSync("db")){
 const nomes=readdirSync("db").filter(n=>n.endsWith(".sql")).sort();
 const ids=nomes.map(n=>Number(n.slice(0,3)));
 for(let i=0;i<nomes.length;i++){
  if(!/^\d{3}_[a-z0-9_]+\.sql$/.test(nomes[i]))
   erros.push("Nome inválido de migração: "+nomes[i]);
  if(ids[i]!==i+1)
   erros.push("Migrações fora de sequência: "+nomes[i]);
 }
 if(!nomes.length)erros.push("Nenhuma migração encontrada.");
}
if(erros.length){
 for(const e of erros)console.error("[ESTRUTURA] "+e);
 process.exitCode=1;
}else console.log("Estrutura, dependências e sequência das migrações conferidas.");
