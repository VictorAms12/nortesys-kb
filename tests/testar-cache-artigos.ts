import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {medirPayloadCache,LIMITE_CONSERVADOR_CACHE_BYTES,registrarTamanhoCacheArtigos}
 from "../src/lib/cache-artigos-metrica";
import {combinarArtigos} from "../src/lib/artigos-visibilidade";
import type {Artigo} from "../src/types/artigo";

test("Cache: mede bytes do JSON sem registrar conteúdo sensível",()=>{
 const segredo="segredo-exclusivo-para-validacao";
 const pequeno=[{titulo:segredo}];
 const tamanho=medirPayloadCache(pequeno);
 assert.equal(tamanho.bytes,Buffer.byteLength(JSON.stringify(pequeno),"utf8"));
 assert.equal(tamanho.acimaLimite,false);
 const logs:string[]=[];
 const medida=registrarTamanhoCacheArtigos("leitor",pequeno,msg=>logs.push(msg));
 assert.equal(medida.bytes,tamanho.bytes);
 assert.equal(logs.length,1);
 assert.match(logs[0],/papel=leitor tamanho_kb=/);
 assert.ok(!logs[0].includes(segredo));
 const grande=medirPayloadCache(["x".repeat(LIMITE_CONSERVADOR_CACHE_BYTES)]);
 assert.equal(grande.acimaLimite,true);
});

test("Cache: leitores não recebem rascunho Markdown nem rascunho SQL",()=>{
 const criar=(slug:string,status:Artigo["status"]):Artigo=>({
  categoria:"erp",slug,status,url:"/artigos/erp/"+slug,titulo:slug,
  atualizadoEm:"2026-10-31",resumo:"",markdown:"",secoes:[],tags:[],
  codigosErro:[],
 } as unknown as Artigo);
 const locais=[criar("publico","revisado"),criar("rascunho-local","rascunho")];
 const registros=[{categoria:"erp",slug:"rascunho-sql",status:"rascunho" as const,
  arquivado:false,conteudo:"conteúdo que nunca deve chegar ao parser do leitor"}];
 const leitor=combinarArtigos(locais,registros,"leitor");
 assert.deepEqual(leitor.map(a=>a.slug),["publico"]);
 assert.ok(leitor.every(a=>a.status!=="rascunho"));
 const editor=combinarArtigos(locais,[],"editor");
 assert.ok(editor.some(a=>a.slug==="rascunho-local"));
});

test("Cache: toda alteração editorial invalida a mesma tag usada pela busca",()=>{
 const route=readFileSync("src/app/api/admin/artigos/route.ts","utf8");
 const cache=readFileSync("src/lib/artigos-banco.ts","utf8");
 const busca=readFileSync("src/lib/cache-busca.ts","utf8");
 const tag=readFileSync("src/lib/tags-cache.ts","utf8");
 assert.match(tag,/TAG_INDICE_BUSCA/);
 assert.match(cache,/tags:\[TAG_INDICE_BUSCA\]/);
 assert.match(busca,/tags:\s*\[TAG_INDICE_BUSCA\]/);
 // Criação, edição e arquivamento usam revalidação imediata.
 assert.equal((route.match(/revalidateTag\(TAG_INDICE_BUSCA,\s*\{\s*expire:\s*0\s*\}\)/g)??[]).length,3);
 assert.match(route,/if \(acao==="criar"\)/);
 assert.match(route,/if \(acao==="arquivar"\)/);
});
