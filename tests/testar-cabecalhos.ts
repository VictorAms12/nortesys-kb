import assert from "node:assert/strict";
import {test} from "node:test";
import nextConfig from "../next.config";
import {montarCsp} from "../src/lib/seguranca-cabecalhos";

test("HSTS, COOP e CORP são declarados em todos os caminhos",async()=>{
 const routes=await nextConfig.headers?.();
 assert.ok(routes?.some(r=>r.source==="/:path*"&&
   r.headers.some(h=>h.key==="Strict-Transport-Security"&&h.value.includes("31536000"))&&
   r.headers.some(h=>h.key==="Cross-Origin-Opener-Policy"&&h.value==="same-origin")&&
   r.headers.some(h=>h.key==="Cross-Origin-Resource-Policy"&&h.value==="same-origin")));
});
test("CSP continua permitindo imagens autenticadas e a conexão Ably",()=>{
 const prod=montarCsp("nonce123",true);
 assert.match(prod,/upgrade-insecure-requests/);
 assert.match(prod,/connect-src 'self' https:\/\/main.realtime.ably.net/);
 assert.match(prod,/img-src 'self' data: blob:/);
 assert.match(prod,/script-src 'self' 'nonce-nonce123'/);
 assert.doesNotMatch(prod,/unsafe-eval/);
 const dev=montarCsp("nonce123",false);
 assert.doesNotMatch(dev,/upgrade-insecure-requests/);
});
