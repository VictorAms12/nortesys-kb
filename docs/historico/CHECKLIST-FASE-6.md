> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Checklist de homologação — Nortesys KB Fase 6

## Banco e código
- [ ] Fazer backup/snapshot do banco Neon antes da migração
- [ ] `npm.cmd run db:migrar` finaliza com sucesso
- [ ] `npm.cmd run db:verificar` mostra banco disponível e contagem de artigos
- [ ] Tabelas `kb_artigos`, `kb_artigo_versoes` e `kb_auditoria` existem
- [ ] `npm.cmd run verificar:fase6` finaliza sem erros
- [ ] `npm.cmd run lint` e `npm.cmd run build` finalizam sem erros

## Acessos e usuários
- [ ] Administrador vê menu Painel
- [ ] Editor entra no painel, mas não acessa `/admin/usuarios` nem `/admin/auditoria`
- [ ] Leitor não consegue acessar `/admin` nem as rotas de alteração
- [ ] Administrador cadastra leitor fictício
- [ ] Duas contas não podem usar o mesmo identificador
- [ ] Administrador altera nome e perfil de uma conta
- [ ] Redefinição de credencial invalida sessões antigas
- [ ] Desativar conta impede novo login; ativar restaura acesso
- [ ] Não é permitido desativar o último administrador ativo

## Artigos
- [ ] Artigos Markdown antigos continuam aparecendo
- [ ] Administrador/editor cria artigo fictício com sete seções
- [ ] Rascunho novo não aparece para o leitor
- [ ] Artigo revisado aparece na home, busca e categoria
- [ ] Editar artigo cria nova revisão e atualiza a busca
- [ ] Histórico mostra versão, autor e data
- [ ] Salvar versão desatualizada não sobrescreve a versão mais recente
- [ ] Arquivar artigo o retira das listagens e conserva o histórico
- [ ] Slug duplicado ou conteúdo inválido é rejeitado
- [ ] Artigos de categoria fiscal sem `revisarAte` são rejeitados

## Segurança e publicação
- [ ] Requisição POST externa ao painel é bloqueada
- [ ] Credenciais não aparecem no HTML de listagem, URLs, logs ou Git
- [ ] Arquivo `.env.local` não está no GitHub
- [ ] Scanner preventivo passou, mas houve revisão humana do conteúdo criado no navegador
- [ ] Testado em Preview protegido com banco Neon de teste
- [ ] Sem dados reais de clientes até a aprovação de segurança e autorização corporativa

**Aceite:** concluir todos os itens críticos sem falhas antes de integrar a branch à `main` e liberar o sistema aos colaboradores.
