import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";
import {test} from "node:test";
import Fuse from "fuse.js";
import {documentosOuro} from "./fixtures/busca-documentos";
import {criarBuscador,executarBusca,executarBuscaOu} from "../src/lib/busca";
import {criarVocabulario} from "../src/lib/busca-sugestoes";
import {prepararConsulta} from "../src/lib/busca-normalizacao";
type Caso={consulta:string;esperado:string[];observacao:string};
const casos=JSON.parse(readFileSync("tests/busca-ouro.json","utf8")) as Caso[];
test("Ouro: 40+ consultas, 90% top-3, zero falsos positivos e média <50 ms",()=>{
 assert.ok(casos.length>=40);
 const docs=documentosOuro(), novos=criarBuscador(docs);
 const antigo=new Fuse(docs,{ignoreDiacritics:true,ignoreLocation:true,includeScore:true,threshold:0.38,
  useTokenSearch:true,keys:[
   {name:"codigosErro",weight:6},{name:"titulo",weight:5},{name:"tags",weight:3},
   {name:"resumo",weight:2.5},{name:"sistema",weight:2},{name:"nomeCategoria",weight:1.2},
   {name:"conteudoBusca",weight:0.6}]});
 let positivos=0,acertos=0,antes=0,falsos=0;
 const medidas:number[]=[];
 for(const caso of casos){
  const baseline=antigo.search(caso.consulta).slice(0,3).map(x=>x.item.url);
  const atual=executarBusca(novos,caso.consulta);
  if(caso.esperado.length){
   positivos++;
   if(caso.esperado.some(x=>baseline.includes(x)))antes++;
   if(caso.esperado.some(x=>atual.slice(0,3).some(r=>r.artigo.url===x)))acertos++;
  }else{
   if(atual.length>0)falsos++;
   assert.deepEqual(executarBuscaOu(novos,caso.consulta),[],"OR não pode inventar resultado: "+caso.consulta);
  }
 }
 for(const item of casos)executarBusca(novos,item.consulta);
 for(let i=0;i<3;i++)for(const item of casos){
  const t=performance.now();executarBusca(novos,item.consulta);
  medidas.push(performance.now()-t);
 }
 const media=medidas.reduce((a,b)=>a+b,0)/medidas.length,precisao=acertos/positivos;
 const vocab=criarVocabulario(docs);
 const tamanho=Buffer.byteLength(JSON.stringify({indice:docs,vocabulario:vocab}))/1024;
 console.log("[busca-ouro] casos="+casos.length+" positivos="+positivos+
  " baseline_top3="+antes+"/"+positivos+" novo_top3="+acertos+"/"+positivos+
  " percentual="+(100*precisao).toFixed(1)+" falsos_positivos="+falsos+
  " media_ms="+media.toFixed(2)+" cache_kb="+tamanho.toFixed(1)+
  " threshold_novo=0.30 threshold_anterior=0.38");
 assert.ok(precisao>=0.9,"Menos de 90% top-3: "+acertos+"/"+positivos);
 assert.equal(falsos,0,"Consultas negativas geraram falsos positivos");
 assert.ok(media<50,"Busca média superou 50 ms: "+media.toFixed(2));
 assert.equal(prepararConsulta("como configurar a impressora"),"configurar impressora");
});
