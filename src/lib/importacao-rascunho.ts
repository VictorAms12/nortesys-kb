import {TIPOS_CONTEUDO,type TipoConteudo} from "./tipos-conteudo";
export const MAXIMO_TEXTO_IMPORTACAO=25000;
export function normalizarTextoImportado(texto:string):string {
  const limpo=texto.replace(/\r\n?/g,"\n").replace(/\u0000/g,"").trim();
  if(limpo.length<20)throw new Error("O documento precisa ter ao menos 20 caracteres úteis.");
  if(limpo.length>MAXIMO_TEXTO_IMPORTACAO)throw new Error("Texto muito grande. Divida em documentos menores (limite de 25.000 caracteres).");
  if(/<script\b/i.test(limpo))throw new Error("Remova trechos de scripts antes da importação.");
  return limpo;
}
/** Preserva o texto original para revisão sem inventar diagnóstico, causa ou solução. */
export function gerarMarkdownImportado(texto:string,tipo:TipoConteudo):string {
  // Não permitir que títulos ou delimitadores Markdown do documento quebrem o modelo obrigatório.
  const origem=normalizarTextoImportado(texto)
    .replace(/^(\s*)#{1,6}\s+(.+)$/gm,"$1**$2**")
    .replace(/^(\s*)(```|~~~)/gm,"$1[trecho de código]");
  const destino=tipo==="solucao"?"Solução passo a passo":tipo==="tutorial"?"Passo a passo":
    tipo==="guia"?"Orientações e exemplos":"Resposta";
  return TIPOS_CONTEUDO[tipo].secoes.map(secao=>{
    const textoSecao=secao===destino
      ?"Material importado para conferência. Revise as instruções antes de publicar.\n\n"+origem
      :"Preencha esta seção após conferir o conteúdo e validar o procedimento.";
    return "## "+secao+"\n\n"+textoSecao;
  }).join("\n\n");
}
export function resumoImportado(texto:string):string {
  const plano=normalizarTextoImportado(texto).replace(/\s+/g," ");
  if(plano.length<=160)return plano;
  return plano.slice(0,157).trim().replace(/\s+\S*$/,"")+"…";
}
