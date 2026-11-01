import assert from "node:assert/strict";
import {test} from "node:test";
import {normalizarTexto,normalizarCodigoErro,prepararConsulta} from "../src/lib/busca-normalizacao";
import {criarBuscador,executarBusca} from "../src/lib/busca";
import type {DocumentoBusca} from "../src/lib/indice-busca";
test("NF-e, NF e, NFe e nota fiscal eletrônica usam forma canônica",()=>{
 for(const x of ["NF-e","nf e","NFe","nota fiscal eletrônica","nota fiscal eletronica"])
  assert.equal(normalizarTexto(x),"nfe");
 for(const x of ["NFC-e","nfce","nfc e"])
  assert.equal(normalizarTexto(x),"nfce");
 assert.equal(normalizarCodigoErro("erro 539"),"539");
 assert.equal(prepararConsulta("como configurar a impressora"),"configurar impressora");
 assert.equal(prepararConsulta("o a"),"o a");
});
test("índice e consulta usam a mesma normalização e códigos exatos",()=>{
 const base={
  tipo:"artigo",nivel:"N1",status:"revisado",atualizadoEm:"2026-01-01",
  revisarAte:null,categoria:"notas-fiscais",nomeCategoria:"Notas fiscais",
  tags:["nfe"],sistema:"ERP",resumo:"Emissão da nota fiscal",
  conteudoBusca:"A nota fiscal eletrônica retorna erro 539"
 } as unknown as DocumentoBusca;
 const docs=[{...base,url:"/artigos/notas-fiscais/nfe",titulo:"Emissão NF-e",codigosErro:["539"]}];
 const fuse=criarBuscador(docs);
 assert.equal(executarBusca(fuse,"nota fiscal eletronica")[0]?.artigo.url,docs[0].url);
 assert.equal(executarBusca(fuse,"erro 539")[0]?.artigo.url,docs[0].url);
 assert.equal(executarBusca(fuse,"539")[0]?.artigo.url,docs[0].url);
});
