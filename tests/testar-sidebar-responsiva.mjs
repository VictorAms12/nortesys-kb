import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("O X de fechar a sidebar não aparece no desktop e permanece disponível no mobile",()=>{
 const css=readFileSync("src/app/globals.css","utf8");
 const geral=css.indexOf("}.botao-icone{");
 const escritorio=css.indexOf("@media(min-width:1001px){.sidebar-app .botao-icone.fechar-menu-mobile{display:none;}");
 const mobile=css.indexOf(".abrir-menu-mobile,.fechar-menu-mobile{\n  display:grid;");
 assert.ok(geral>=0&&escritorio>geral,"a proteção de desktop precisa vencer o display:grid genérico");
 assert.ok(mobile>=0,"o botão de fechar deve continuar disponível no menu móvel");
 assert.match(css,/\.estrutura-app\[data-menu-mobile="aberto"\] \.sidebar-app/);
});
