import assert from "node:assert/strict";
import {test} from "node:test";
import {formatarRegistro} from "../src/lib/registro-atendimento";
import {gerarMarkdownImportado,normalizarTextoImportado,resumoImportado} from "../src/lib/importacao-rascunho";
import {FLUXOS_DIAGNOSTICO} from "../src/lib/diagnostico";
import {variacoesBusca} from "../src/lib/busca";
import {sugerirArtigosRelacionados} from "../src/lib/artigos-relacionados";
import type {Artigo} from "../src/types/artigo";
import {TIPOS_CONTEUDO} from "../src/lib/tipos-conteudo";
test("7F: registro técnico preserva estrutura e campos sem inventar respostas",()=>{
  const registro=formatarRegistro({tipo:"ERP",dificuldade:"  Erro ao emitir NF-e  ",
    versao:"",atualizou:"Não",erro:"590",repasse:"Não",tarefa:"",resumo:"Foi orientado a verificar os dados",
    resultado:"Aguardando"});
  for(const trecho of ["TIPO DE ATENDIMENTO:","DIFICULDADE ENCONTRADA:","PRECISOU ATUALIZAR:",
    "FOI REPASSADO AO GESTOR TÉCNICO, COM VÍDEO OU PRINTS DOS ERROS?:",
    "LINK DA TAREFA:","RESUMO DO ATENDIMENTO:","RESULTADO:"])
    assert.ok(registro.includes(trecho),trecho);
  assert.ok(registro.includes("Não informado"));
  assert.ok(registro.includes("Erro ao emitir NF-e"));
});
test("7F: importação prepara seções oficiais sem fabricar diagnóstico",()=>{
  const original="Procedimento copiado do manual de testes.\n\n## Título do documento\n\nConferir os dados e revisar.";
  for(const tipo of ["solucao","tutorial","guia","faq"] as const){
    const md=gerarMarkdownImportado(original,tipo);
    assert.ok(md.includes("Procedimento copiado"));
    assert.ok(md.includes("**Título do documento**"));
    const headings=md.match(/^## /gm)??[];
    assert.equal(headings.length,TIPOS_CONTEUDO[tipo].secoes.length);
  }
  assert.ok(resumoImportado(original).length<=160);
  assert.throws(()=>normalizarTextoImportado(""),/20 caracteres/);
  assert.throws(()=>normalizarTextoImportado("A".repeat(25001)),/25.000/);
});
test("7E: todos os destinos de triagem existem e levam a pesquisa ou próximo passo",()=>{
  for(const fluxo of FLUXOS_DIAGNOSTICO){
    assert.ok(fluxo.etapas[fluxo.inicio]);
    for(const e of Object.values(fluxo.etapas)){
      assert.ok(e.opcoes?.length||e.pesquisa||e.solicitarCodigo,fluxo.id);
      for(const opcao of e.opcoes??[])assert.ok(fluxo.etapas[opcao.proximo]);
    }
  }
});

test("7E: variantes de siglas e relacionados exigem evidências de conteúdo",()=>{
  assert.ok(variacoesBusca("NF-E").includes("nfe"));
  assert.ok(variacoesBusca("NFC-e").includes("nfce"));
  assert.deepEqual(variacoesBusca("termo desconhecido"),[]);
  const base={url:"/artigos/erp/primeiro",status:"revisado",titulo:"Rejeição NF-e 590",categoria:"erp",
    sistema:"Nortesys",tags:["fiscal"],codigosErro:["590"]} as Artigo;
  const parecido={...base,url:"/artigos/erp/segundo",titulo:"Rejeição 590 ao autorizar nota"};
  const outro={...base,url:"/artigos/erp/terceiro",titulo:"Gerenciar impressoras",
    tags:["impressoras"],codigosErro:[]};
  const rascunho={...parecido,url:"/artigos/erp/rascunho",status:"rascunho" as const};
  assert.deepEqual(sugerirArtigosRelacionados(base,[base,outro,rascunho,parecido]).map(a=>a.url),[parecido.url]);
});
