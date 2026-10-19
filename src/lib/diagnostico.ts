/** Fluxos de triagem, não uma fonte de orientação fiscal. Terminais apontam para a base. */
export type OpcaoDiagnostico = { rotulo: string; proximo: string };
export type EtapaDiagnostico = {
  titulo: string; descricao: string; opcoes?: OpcaoDiagnostico[]; pesquisa?: string;
  solicitarCodigo?: boolean;
};
export type FluxoDiagnostico = { id: string; titulo: string; descricao: string; inicio: string; etapas: Record<string, EtapaDiagnostico> };
export const FLUXOS_DIAGNOSTICO: FluxoDiagnostico[] = [
  { id: "documentos-fiscais", titulo: "NF-e e NFC-e", descricao: "Rejeição, erro de emissão ou transmissão.", inicio: "tipo",
    etapas: {
      tipo: { titulo: "O problema acontece em qual etapa?", descricao: "Escolha o sintoma informado pelo ERP ou pelo autorizador.", opcoes: [
        {rotulo:"Há um código de rejeição da SEFAZ", proximo:"codigo"},
        {rotulo:"Erro ao gerar, assinar ou transmitir",proximo:"transmissao"},
        {rotulo:"Erro relacionado à tributação",proximo:"fiscal"}
      ] },
      codigo: { titulo:"Consulte o código exato",descricao:"Informe o código ou a mensagem exibida. Confira o documento e a operação antes de aplicar qualquer correção.",solicitarCodigo:true,pesquisa:"rejeição" },
      transmissao:{titulo:"Investigue geração e transmissão",descricao:"Anote a mensagem completa, o modelo (55/65), a versão do ERP e a etapa da falha. Consulte os procedimentos existentes.",pesquisa:"transmissão nota fiscal"},
      fiscal:{titulo:"Confira os dados fiscais",descricao:"Identifique CFOP, CST/CSOSN, regime e operação conforme o erro. Confirme as regras com a orientação fiscal vigente.",pesquisa:"CFOP CST CSOSN"}
    }
  },
  {id:"impressao", titulo:"Impressão", descricao:"Impressão duplicada, fila parada ou dispositivo sem resposta.",inicio:"problema",
    etapas:{
      problema:{titulo:"Qual comportamento ocorre?",descricao:"Distinga uma falha de impressão do ERP de uma falha do sistema operacional.",opcoes:[
        {rotulo:"Impressão duplicada",proximo:"duplicada"},
        {rotulo:"Não imprime ou fica na fila",proximo:"fila"},
        {rotulo:"Imprime com layout incorreto",proximo:"layout"}
      ]},
      duplicada:{titulo:"Verifique a origem da duplicidade",descricao:"Confirme se a solicitação foi repetida no ERP ou se a fila contém trabalhos duplicados. Documente antes de excluir qualquer item.",pesquisa:"impressão duplicada"},
      fila:{titulo:"Identifique onde está bloqueando",descricao:"Observe serviço de impressão, fila, conectividade e driver. Escolha o procedimento de acordo com o comportamento observado.",pesquisa:"fila de impressão"},
      layout:{titulo:"Revise o relatório e a configuração",descricao:"Registre o modelo do relatório, impressora selecionada e exemplos do resultado, sem informações sensíveis.",pesquisa:"impressão relatório"}
    }
  },
  {id:"acesso",titulo:"Acesso e permissões",descricao:"Login, credenciais, usuários ou acesso a funcionalidades.",inicio:"problema",
    etapas:{
      problema:{titulo:"Qual o tipo de dificuldade?",descricao:"Não registre senhas nem tokens no atendimento.",opcoes:[
        {rotulo:"Não consegue entrar no sistema",proximo:"login"},
        {rotulo:"Entra, mas não acessa um recurso",proximo:"permissao"},
        {rotulo:"Problema após atualização",proximo:"versao"}
      ]},
      login:{titulo:"Verifique autenticação",descricao:"Registre somente mensagem de erro, ambiente, usuário de referência sem credenciais e estado da conexão.",pesquisa:"login acesso ERP"},
      permissao:{titulo:"Investigue o perfil de acesso",descricao:"Confira a função pretendida e o perfil autorizado, sem elevar privilégios sem aprovação.",pesquisa:"permissão usuário ERP"},
      versao:{titulo:"Confira a versão e a mudança",descricao:"Compare a versão instalada com os requisitos e procedimentos documentados.",pesquisa:"atualização acesso ERP"}
    }
  },
  {id:"instalacao",titulo:"Instalação e atualização",descricao:"Falhas na instalação, dependências ou componentes.",inicio:"problema",
    etapas:{
      problema:{titulo:"Em qual momento ocorre a falha?",descricao:"Identifique sistema operacional, versão e mensagem completa.",opcoes:[
        {rotulo:"Instalação inicial",proximo:"instalacao"},
        {rotulo:"Atualização de versão",proximo:"atualizacao"},
        {rotulo:"Programa não inicia",proximo:"inicializacao"}
      ]},
      instalacao:{titulo:"Confira pré-requisitos",descricao:"Confirme arquitetura, dependências, permissões e integridade do instalador seguindo documentação validada.",pesquisa:"instalação sistema"},
      atualizacao:{titulo:"Confira o procedimento de atualização",descricao:"Registre versão anterior e nova, necessidade de backup e etapa da falha antes de repetir operações.",pesquisa:"atualização versão ERP"},
      inicializacao:{titulo:"Investigue a inicialização",descricao:"Consulte logs, serviços e dependências relevantes, sem alterar configurações de produção sem autorização.",pesquisa:"programa não abre"}
    }
  }
];
export function encontrarFluxo(id:string):FluxoDiagnostico|undefined {
  return FLUXOS_DIAGNOSTICO.find(item=>item.id===id);
}
