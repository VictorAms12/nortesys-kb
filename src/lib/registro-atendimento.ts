/** Relatório de suporte montado no navegador, sem guardar atendimentos no KB. */
export type CamposRegistro = {
  tipo:string; dificuldade:string; versao:string; atualizou:"Sim"|"Não"|"Não informado";
  erro:string; repasse:string; tarefa:string; resumo:string; resultado:string;
};
function limpar(v:string):string {return v.replace(/\r\n?/g,"\n").trim().slice(0,3000)||"Não informado";}
export function formatarRegistro(c:CamposRegistro):string {
  return [
    ["TIPO DE ATENDIMENTO",c.tipo],
    ["DIFICULDADE ENCONTRADA",c.dificuldade],
    ["VERSÃO ATUAL DO CLIENTE",c.versao],
    ["PRECISOU ATUALIZAR",c.atualizou],
    ["SISTEMA GEROU ALGUM ERRO? QUAL?",c.erro],
    ["FOI REPASSADO AO GESTOR TÉCNICO, COM VÍDEO OU PRINTS DOS ERROS?",c.repasse],
    ["LINK DA TAREFA",c.tarefa],
    ["RESUMO DO ATENDIMENTO",c.resumo],
    ["RESULTADO",c.resultado],
  ].map(([chave,valor])=>chave+":\n"+limpar(valor)).join("\n\n");
}
