import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/admin/imagens-local/route";
import {
  identificarImagemLocal, altImagemLocal, TAMANHO_MAXIMO_IMAGEM_LOCAL,
} from "../src/lib/imagens-local";

const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1]);
const jpg = Uint8Array.from([255,216,255,224,0,16,74,70,73,70]);
const webp = Uint8Array.from(Buffer.from("RIFFxxxxWEBPVP8 xxxxxx", "ascii"));
assert.equal(identificarImagemLocal(png,"image/png")?.extensao,"png");
assert.equal(identificarImagemLocal(jpg,"image/jpeg")?.extensao,"jpg");
assert.equal(identificarImagemLocal(webp,"image/webp")?.extensao,"webp");
assert.equal(identificarImagemLocal(png,"image/svg+xml"),null);
assert.equal(identificarImagemLocal(jpg,"image/png"),null);
assert.equal(identificarImagemLocal(new Uint8Array([1,2,3]),"image/png"),null);
assert.equal(identificarImagemLocal(new Uint8Array(TAMANHO_MAXIMO_IMAGEM_LOCAL+1),"image/png"),null);
assert.equal(altImagemLocal("tela [clientes] (1).png"),"tela clientes 1");
const ler=(p:string)=>readFileSync(p,"utf8");
const rota=ler("src/app/api/admin/imagens-local/route.ts");
assert.match(rota,/NODE_ENV !== "development"/);
assert.match(rota,/localhost\|127/);
assert.match(rota,/verificarOrigemPost/);
assert.match(rota,/obterSessao/);
assert.match(rota,/identificarImagemLocal/);
assert.match(rota,/writeFile/);
const editor=ler("src/components/editor-markdown.tsx");
assert.match(editor,/Enviar print/);
assert.match(editor,/\/api\/admin\/imagens/);
assert.match(editor,/inserirReferenciaImagem/);
const markdown=ler("src/components/conteudo-markdown.tsx");
assert.match(markdown,/contemImagem\(node\)/);
assert.match(markdown,/<div className="my-4">/);
assert.match(ler(".gitignore"),/\/public\/imagens\/uploads-locais\//);
console.log("OK: assinaturas PNG/JPG/WebP, limites, rota protegida, editor, Markdown e gitignore.");

async function testarBloqueios() {
  const ambienteAnterior = process.env.NODE_ENV;
  try {
    const requisicao = (host: string, origem: string) => new NextRequest(`http://${host}/api/admin/imagens-local`, {
      method: "POST", headers: { host, origin: origem },
    });
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal((await POST(requisicao("localhost:3000", "http://localhost:3000"))).status, 404);
    Object.assign(process.env, { NODE_ENV: "development" });
    assert.equal((await POST(requisicao("externo.test", "http://externo.test"))).status, 404);
    assert.equal((await POST(requisicao("localhost:3000", "http://externo.test"))).status, 403);
    // Sem cookie, obterSessao retorna antes de qualquer consulta ao banco.
    assert.equal((await POST(requisicao("localhost:3000", "http://localhost:3000"))).status, 403);
    console.log("OK: rota bloqueia produção, host externo, origem externa e sessão ausente, sem banco.");
  } finally {
    if (ambienteAnterior === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: ambienteAnterior });
  }
}
testarBloqueios().catch(erro => { console.error(erro); process.exitCode = 1; });
