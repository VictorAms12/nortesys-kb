import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("chat: botões Conversas e Fechar ficam ocultos no desktop sem afetar o menu móvel",()=>{
 const css=readFileSync("src/app/globals.css","utf8");
 const componente=readFileSync("src/components/chat-painel.tsx","utf8");
 const regraDesktop=/@media\(min-width:1024px\)\s*\{\s*\.chat-painel button\.chat-botao-contatos,\s*\.chat-painel button\.chat-fechar-lista\s*\{display:none;\}\s*\}/;
 assert.match(css,regraDesktop,"ocultar os dois botões a partir de 1024 px");
 assert.ok(css.indexOf("@media(min-width:1024px){")>css.indexOf("}.botao-primario,.botao-secundario,.botao-copiar,.login-submit{"),"a regra desktop deve vir após o display genérico de botões");
 assert.match(css,/@media\(max-width:1023px\)[\s\S]*?\.chat-botao-contatos,\.chat-fechar-lista\s*\{\s*display:inline-flex;/,"manter os controles ativos no layout móvel");
 assert.match(componente,/className="chat-botao-contatos botao-secundario"/);
 assert.match(componente,/className="chat-fechar-lista botao-secundario"/);
});
