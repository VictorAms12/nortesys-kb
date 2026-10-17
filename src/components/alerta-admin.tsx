const avisos:Record<string,string>={
  imagens:"Há uma imagem indisponível ou vinculada a outro artigo/usuário. Remova a referência e envie a imagem novamente neste artigo.",
  salvo:"Alterações gravadas com sucesso.",criado:"Conta criada. Entregue a credencial inicial ao colega por canal privado.",
  arquivado:"Artigo arquivado e removido das listagens.",credencial_redefinida:"Credencial redefinida. Sessões antigas foram revogadas.",
  duplicado:"Identificador já existe.",conflito:"Outra edição ocorreu antes da sua. Reabra o artigo e revise.",
  conflito_arquivo:"Já existe um artigo Markdown com essa categoria e identificador.",
  validacao:"Artigo inválido. Confira campos, datas e as sete seções obrigatórias.",
  indisponivel:"A operação não foi concluída. Confira a conexão e as migrações do banco.",
  dados:"Dados inválidos. Revise os campos e o tamanho da credencial (mínimo de 12 caracteres).",
  ultimo_admin:"Não é permitido desativar ou rebaixar o último administrador ativo.",
  proprio:"Você não pode desativar nem alterar seu próprio perfil nesta tela.",
};
export function AlertaAdmin({codigo}:{codigo?:string}) {
  return codigo && avisos[codigo] ? <div className="aviso-artigo mb-5" role="status">{avisos[codigo]}</div> : null;
}
