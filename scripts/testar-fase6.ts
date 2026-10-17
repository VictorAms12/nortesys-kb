import assert from "node:assert/strict";
import { criarTextoDoFormulario, MODELO_CORPO, slugValido } from "../src/lib/formulario-artigo";
import { validarTextoArtigo } from "../src/lib/artigos";
import { modeloConteudo } from "../src/lib/tipos-conteudo";

function exemplo():FormData {
  const form=new FormData();
  const dados:Record<string,string>={
    titulo:"Procedimento demonstrativo de teste",resumo:"Exemplo técnico criado apenas para homologação.",
    categoria:"erp",slug:"procedimento-demonstrativo",sistema:"Nortesys",nivel:"N1",
    status:"rascunho",tags:"demo, homologacao",codigosErro:"TESTE-001",
    revisarAte:"", fonteOficial:"",conteudo:MODELO_CORPO,
  };
  for (const [campo,valor] of Object.entries(dados)) form.set(campo,valor);
  return form;
}
function executar() {
  assert.equal(slugValido.test("artigo-teste"),true);
  assert.equal(slugValido.test("../../segredo"),false);
  const formulario=exemplo();
  const salvo=criarTextoDoFormulario(formulario,"Colaborador de Teste");
  const artigo=validarTextoArtigo("content/erp/procedimento-demonstrativo.md",salvo.conteudo);
  assert.equal(artigo.secoes.length,7);
  assert.equal(artigo.tags.length,2);
  assert.equal(artigo.codigosErro?.[0],"TESTE-001");
  // O formulário legado (Fase 6) não envia `tipo` e deve continuar válido.
  assert.equal(artigo.tipo,"solucao");
  // Novos tipos, introduzidos na Fase 7B, continuam sendo aceitos.
  formulario.set("tipo","tutorial");
  formulario.set("conteudo",modeloConteudo("tutorial"));
  const tutorial=criarTextoDoFormulario(formulario,"Colaborador de Teste");
  assert.equal(validarTextoArtigo("content/erp/procedimento-demonstrativo.md",tutorial.conteudo).tipo,"tutorial");
  // Um tipo fornecido, mas inexistente, deve ser rejeitado.
  formulario.set("tipo","tipo-invalido");
  assert.throws(()=>criarTextoDoFormulario(formulario,"Colaborador"));
  formulario.set("tipo","solucao");
  formulario.set("conteudo","Texto sem estrutura obrigatória");
  assert.throws(()=>criarTextoDoFormulario(formulario,"Colaborador"));
  console.log("Fase 6/7B: compatibilidade de formulários, tipos, slug e seções validada.");
}
executar();
