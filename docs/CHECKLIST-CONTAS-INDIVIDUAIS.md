# Checklist — Contas individuais (Fase 5)

## Configuração

- [ ] Preservei meu arquivo `.env.local` antigo sem divulgá-lo.
- [ ] `KB_SESSION_SECRET` tem ao menos 32 caracteres e está configurado.
- [ ] Criei minha conta e ao menos uma conta diferente para um colega.
- [ ] O comando `usuario:listar` mostra apenas os nomes e usuários, não as senhas.
- [ ] `.env.local` não está incluído no `git status` para commit.

## Verificações automáticas

- [ ] `npm.cmd run verificar:estrutura`
- [ ] `npm.cmd run verificar`
- [ ] `npm.cmd run testar:usuarios`
- [ ] `npm.cmd run testar:seguranca`
- [ ] `npm.cmd run lint`
- [ ] `npm.cmd run build`

## Navegador

- [ ] A tela `/entrar` pede usuário e senha.
- [ ] Minha conta entra normalmente.
- [ ] O colega consegue entrar com sua própria conta.
- [ ] A senha de um usuário não autentica o outro.
- [ ] Senha incorreta retorna erro genérico.
- [ ] Nome da pessoa é exibido na navegação.
- [ ] Páginas de artigos e busca exigem login.
- [ ] Sair encerra a sessão no navegador.
- [ ] Troca de senha invalida sessões anteriores após reiniciar o servidor ou redeploy.
- [ ] Remover a conta bloqueia novos logins e suas sessões após atualização do ambiente.
- [ ] Busca, filtros e temas da Fase 4 continuam funcionando.

## Vercel / testes em equipe

- [ ] Configurei `KB_USERS` e `KB_SESSION_SECRET` nas variáveis do ambiente correto.
- [ ] Fiz novo deploy após qualquer alteração nas contas.
- [ ] O site Preview tem proteção adicional, enquanto não houver rate limiting distribuído.
- [ ] Nenhum documento de cliente real ou senha foi exposto no repositório.

**Resultado:** [ ] Aprovado  [ ] Pendente
