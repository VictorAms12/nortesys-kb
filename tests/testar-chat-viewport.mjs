import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const css=readFileSync("src/app/globals.css","utf8");
const painel=readFileSync("src/components/chat-painel.tsx","utf8");
test("Chat mede altura visível e mantém um escape de rolagem em janelas baixas",()=>{
 assert.match(painel,/visualViewport/);
 assert.match(painel,/getBoundingClientRect\(\)\.top/);
 assert.match(painel,/Math\.max\(310,disponivel\)/);
 assert.match(painel,/margemInferior=window\.innerWidth<=680\?20:24/);
 assert.match(painel,/fundo-topo-margemInferior/);
 assert.match(painel,/ref=\{painelRef\}/);
 assert.match(css,/\.chat-painel\s*\{[^}]*grid-template-rows:minmax\(0,1fr\)/s);
 assert.match(css,/\.chat-painel \.chat-historico\s*\{[^}]*overflow-y:auto/s);
 assert.match(css,/\.chat-painel \.chat-compositor\s*\{[^}]*flex:0 0 auto/s);
 assert.match(css,/\.estrutura-chat \.area-app\s*\{[^}]*overflow:visible/s);
 assert.doesNotMatch(css,/\.estrutura-chat \.area-app\s*\{[^}]*overflow:hidden/s);
 assert.doesNotMatch(css,/\.chat-painel\s*\{[^}]*height:100%/s);
});
