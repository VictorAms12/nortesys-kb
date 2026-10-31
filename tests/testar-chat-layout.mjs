import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const css=readFileSync("src/app/globals.css","utf8");
const pagina=readFileSync("src/app/chat/page.tsx","utf8");
const painel=readFileSync("src/components/chat-painel.tsx","utf8");
test("Chat usa linhas de mensagens, histórico com scroll e compositor independente",()=>{
 assert.match(css,/\.chat-painel\{display:grid;flex:1;min-height:0;height:auto;grid-template-columns:260px/s);
 assert.match(css,/\.chat-painel \.chat-historico\{flex:1 1 0%;min-height:0;overflow-y:auto/);
 assert.match(css,/\.chat-painel \.chat-compositor\{flex:0 0 auto/);
 assert.match(painel,/chat-linha-mensagem/);
 assert.match(painel,/chat-barra-acoes/);
 assert.doesNotMatch(painel,/justify-end|chat-balao/);
 assert.match(pagina,/pagina-chat conteiner/);
});
test("Enviar mensagem mantém o foco e Ctrl+V",()=>{
 assert.match(painel,/ref=\{campoMensagemRef\}/);
 assert.match(painel,/readOnly=\{enviando\} disabled=\{!estado\}/);
 assert.match(painel,/campoMensagemRef\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(painel,/onPaste=\{colarImagem\}/);
 assert.match(painel,/ref=\{botaoEnviarRef\}/);
});
