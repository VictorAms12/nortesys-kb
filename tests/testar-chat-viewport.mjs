import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const css=readFileSync("src/app/globals.css","utf8");
const painel=readFileSync("src/components/chat-painel.tsx","utf8");
test("Chat utiliza 100dvh e flex sem altura calculada por JavaScript",()=>{
 assert.match(css,/\.estrutura-chat\{display:flex;height:100dvh/);
 assert.match(css,/\.pagina-chat\{flex:1/);
 assert.match(css,/\.chat-painel\{display:grid;flex:1;min-height:0/);
 assert.doesNotMatch(painel,/visualViewport|getBoundingClientRect\(\)\.top|painel\.style\.height/);
 assert.match(css,/@media\(max-width:680px\)/);
});
