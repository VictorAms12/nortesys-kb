import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const ler=p=>readFileSync(p,"utf8");
for(const rota of ["src/app/artigos/page.tsx","src/app/categorias/page.tsx","src/app/busca/page.tsx","src/app/admin/page.tsx","src/app/entrar/page.tsx"])
 assert.ok(existsSync(rota), "Rota ausente: "+rota);
const shell=ler("src/components/estrutura-aplicacao.tsx");
for(const marca of ['href:"/"','href:"/chat"','href:"/favoritos"','href:"/recentes"','href:"/diagnostico"','href:"/ferramentas/registro"','href:"/admin"','href:"/admin/artigos"'])
 assert.ok(shell.includes(marca),"Menu sem destino "+marca);
assert.match(shell,/destinosCategorias/);
assert.match(shell,/papel!=="leitor"/);
assert.match(shell,/papel==="administrador"/);
assert.match(shell,/salvarPreferencia\(CHAVE/);
assert.match(shell,/e\.key==="Escape"/);
assert.match(shell,/aria-expanded=\{mobileAberta\}/);
assert.match(shell,/pathname==="/entrar"/);
assert.doesNotMatch(shell,/texto:"Pesquisar"/);
const css=ler("src/app/globals.css");
assert.match(css,/--sidebar-width:232px/);
assert.match(css,/--topbar-height:52px/);
assert.match(css,/@media\(max-width:1000px\)/);
assert.match(css,/prefers-reduced-motion/);
assert.match(ler("src/app/layout.tsx"),/<EstruturaAplicacao/);
assert.ok(!existsSync("db/003_redesign.sql"));
console.log("Navegação técnica, permissões e responsividade conferidas.");
