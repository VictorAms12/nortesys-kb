import { test } from "node:test";
import assert from "node:assert/strict";
import { ErroFormularioLimitado, lerFormularioLimitado, lerFormularioUrlEncodedLimitado, lerTextoLimitado } from "../src/lib/formulario-limitado";

function req(body: BodyInit | null, headers: Record<string,string> = {}): Request {
 return new Request("http://localhost/api/teste", { method: "POST", headers, body });
}

test("limite de leitura conta bytes UTF-8, não caracteres", async () => {
 const payload = "á".repeat(8);
 assert.equal(await lerTextoLimitado(req(payload),16),payload);
 await assert.rejects(lerTextoLimitado(req(payload),15), (e:unknown) =>
  e instanceof ErroFormularioLimitado && e.status===413);
});

test("Content-Length inválido ou acima do limite é recusado", async () => {
 for (const cabecalho of ["abc","-1","99"]) {
  await assert.rejects(lerTextoLimitado(req("ok",{"content-length":cabecalho}),8),
   (e:unknown)=>e instanceof ErroFormularioLimitado && e.status===413);
 }
});

test("formulário URL-encoded mantém UTF-8 e campos repetidos", async () => {
 const corpo=new URLSearchParams();
 corpo.append("nome","João Suporte");
 corpo.append("tag","fiscal");corpo.append("tag","erp");
 const form=await lerFormularioUrlEncodedLimitado(req(corpo,{"content-type":"application/x-www-form-urlencoded"}),256);
 assert.equal(form.get("nome"),"João Suporte");
 assert.deepEqual(form.getAll("tag"),["fiscal","erp"]);
});

test("stream sem Content-Length é interrompido ao exceder o limite", async () => {
 const stream=new ReadableStream<Uint8Array>({
  start(controller) {
   controller.enqueue(new TextEncoder().encode("1234"));
   controller.enqueue(new TextEncoder().encode("56789"));
   controller.close();
  },
 });
 const requisicao=new Request("http://localhost/api/teste", {
  method:"POST",body:stream,duplex:"half",
 } as RequestInit & {duplex:string});
 await assert.rejects(lerTextoLimitado(requisicao,8),
  (e:unknown)=>e instanceof ErroFormularioLimitado && e.status===413);
});

test("multipart permanece legível e corpo ausente é recusado",async()=>{
 const dados=new FormData();dados.set("titulo","Teste");
 const multipart=req(dados);
 const resultado=await lerFormularioLimitado(multipart,1024,{
  grande:"Grande",ausente:"Ausente",invalido:"Inválido",
 });
 assert.equal(resultado.get("titulo"),"Teste");
 await assert.rejects(lerTextoLimitado(req(null),100),
  (e:unknown)=>e instanceof ErroFormularioLimitado && e.status===400);
});
