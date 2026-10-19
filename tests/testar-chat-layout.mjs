import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const css=readFileSync("src/app/globals.css","utf8");
const pagina=readFileSync("src/app/chat/page.tsx","utf8");
const painel=readFileSync("src/components/chat-painel.tsx","utf8");
test("Chat usa grid de linha contraída e compositor fora da rolagem",()=>{
 assert.match(css,/\.chat-painel\s*\{[^}]*grid-template-rows:minmax\(0,1fr\)/s);
 assert.match(css,/\.chat-painel\s*\{[^}]*height:calc\(100dvh - 104px\)/s);
 assert.match(painel,/painel\.style\.height/);
 assert.match(css,/\.chat-painel \.chat-area-mensagens\s*\{[^}]*height:100%/s);
 assert.match(css,/\.chat-painel \.chat-historico\s*\{[^}]*overflow-y:auto/s);
 assert.match(css,/\.chat-painel \.chat-compositor\s*\{[^}]*flex:0 0 auto/s);
 assert.doesNotMatch(css,/\.chat-painel[^\n]*height:100%/);
 assert.doesNotMatch(painel,/min-h-\[600px\]|maxHeight:"55vh"/);
 assert.match(painel,/chat-historico/);
 assert.match(painel,/chat-compositor/);
 assert.match(pagina,/pagina-chat conteiner/);
 assert.doesNotMatch(pagina,/chat-intro|<nav/);
});

test("Enviar mensagem mantém o campo pronto para continuar digitando",()=>{
 assert.match(painel,/ref=\{campoMensagemRef\}/);
 assert.match(painel,/readOnly=\{enviando\} disabled=\{!estado\}/);
 assert.doesNotMatch(painel,/disabled=\{enviando\|\|!estado\}/);
 assert.match(painel,/campoMensagemRef\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(painel,/ref=\{botaoEnviarRef\}/);
});
