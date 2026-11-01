import assert from "node:assert/strict";
import {test} from "node:test";
import {codigoOuSigla,criarVocabulario,distanciaEdicao,confereTermos,sugerirConsultas,toleranciaEdicao,tokensDocumento} from "../src/lib/busca-sugestoes";
import {criarBuscador,executarBusca,executarBuscaOu} from "../src/lib/busca";
import type {DocumentoBusca} from "../src/lib/indice-busca";
const doc={url:"/artigos/infra/impressora",titulo:"Configurar impressora",resumo:"Impressão e spooler",sistema:"ERP",nomeCategoria:"Infraestrutura",conteudoBusca:"Configurar fila de impressão",tags:["impressora"],codigosErro:[],categoria:"infra",status:"revisado",nivel:"N1",atualizadoEm:"2026-01-01"} as unknown as DocumentoBusca;
test("Fuzzy curto, códigos numéricos exatos e sugestões relevantes",()=>{
 assert.equal(toleranciaEdicao("abc"),0);
 assert.equal(toleranciaEdicao("senha"),1);
 assert.equal(toleranciaEdicao("impressora"),2);
 assert.equal(toleranciaEdicao("539"),0);
 assert.equal(codigoOuSigla("NF-e"),true);
 assert.equal(distanciaEdicao("empresora","impressora",2),2);
 const vocab=criarVocabulario([doc]);
 assert.ok(sugerirConsultas("empresora",vocab).includes("impressora"));
 assert.deepEqual(sugerirConsultas("540",["539"]),[]);
 assert.equal(confereTermos(tokensDocumento(doc),"impressora"),true);
 assert.equal(confereTermos(tokensDocumento(doc),"xyz"),false);
});
test("Não retorna resultado com código errado; OR apenas após busca vazia",()=>{
 const buscar=criarBuscador([doc]);
 assert.equal(executarBusca(buscar,"impressora")[0]?.artigo.url,doc.url);
 assert.deepEqual(executarBusca(buscar,"AB9C"),[]);
 assert.deepEqual(executarBuscaOu(buscar,"zzz qqq"),[]);
 assert.equal(executarBuscaOu(buscar,"impressora desconhecido")[0]?.artigo.url,doc.url);
});
