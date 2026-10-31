import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ler=p=>readFileSync(p,"utf8");
test("Home e login não usam estrutura de marketing",()=>{
 const inicio=ler("src/app/page.tsx"),login=ler("src/app/entrar/page.tsx");
 assert.doesNotMatch(inicio,/hero-inicio|destaque-hero|icone-indicador|↗/);
 assert.doesNotMatch(login,/login-intro|login-tags|login-logo|login-kicker|CONHECIMENTO QUE CONECTA/);
 assert.match(inicio,/Atualizados recentemente/);
 assert.match(inicio,/Precisam de revisão/);
});
test("Interface usa tokens e não animações de entrada",()=>{
 const css=ler("src/app/globals.css");
 assert.match(css,/--sidebar-width:232px/);
 assert.match(css,/--radius:4px/);
 assert.match(css,/--font-mono:/);
 assert.match(css,/:root\[data-theme="dark"\]/);
 assert.doesNotMatch(css,/gradient\(/);
 assert.doesNotMatch(ler("src/app/template.tsx"),/entrada-pagina/);
});
test("Chat não alterna lado e mantém ações de teclado",()=>{
 const chat=ler("src/components/chat-painel.tsx");
 assert.doesNotMatch(chat,/justify-end|chat-balao/);
 assert.match(chat,/chat-barra-acoes/);
 assert.match(chat,/onKeyDown=/);
 assert.match(chat,/Shift\+Enter/);
});
test("Busca global mantém sessão e pesquisa autorizada",()=>{
 const route=ler("src/app/api/busca/sugestoes/route.ts");
 assert.match(route,/obterSessao/);
 assert.match(route,/obterDadosBusca\(sessao.papel\)/);
 assert.match(route,/slice\(0,6\)/);
 const box=ler("src/components/atalho-busca.tsx");
 assert.match(box,/ArrowDown/);assert.match(box,/ArrowUp/);
 assert.match(box,/Escape/);assert.match(box,/role="combobox"/);
});
