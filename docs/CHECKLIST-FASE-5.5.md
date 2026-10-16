# Checklist de homologação — Fase 5.5

## Arquivos, dependências e banco

- [ ] ZIP de atualização extraído na raiz correta do projeto anterior.
- [ ] `npm install` termina sem erros.
- [ ] `.env.local` contém a `DATABASE_URL` do Neon e está fora do Git.
- [ ] `npm run db:migrar` conclui sem erros.
- [ ] `npm run db:verificar` reconhece o PostgreSQL.
- [ ] Reexecutar `db:migrar` não apaga usuários.

## Usuários

- [ ] Criado administrador, criado usuário leitor e criado usuário editor.
- [ ] `usuario:listar` mostra cada conta com papel e estado.
- [ ] Login com credenciais corretas redireciona à página inicial.
- [ ] Credenciais incorretas mostram erro genérico.
- [ ] Acesso sem login à `/busca` exige autenticação.
- [ ] Logout invalida a sessão, inclusive se o cookie antigo for reutilizado.
- [ ] `usuario:senha` invalida as sessões da conta.
- [ ] `usuario:desativar` bloqueia a conta imediatamente.
- [ ] `usuario:ativar` habilita a conta novamente com a senha vigente.
- [ ] O último administrador não pode ser removido nem desativado pelo CLI.
- [ ] Após 5 tentativas incorretas, o login é temporariamente bloqueado.
- [ ] Contas antigas importadas por `usuario:migrar` mantêm a mesma senha.

## Build e publicação

- [ ] `npm run verificar:estrutura` passou.
- [ ] `npm run verificar` passou sem detectar dados reais.
- [ ] `npm run testar:usuarios`, `testar:seguranca` e `testar:banco` passaram.
- [ ] `npm run lint` terminou sem erros.
- [ ] `npm run build` terminou sem erros.
- [ ] As páginas de busca, artigos e categorias continuam funcionando.
- [ ] O Git não inclui `.env.local`, credenciais nem `node_modules`.
- [ ] Preview na Vercel protegido por autenticação da plataforma.
- [ ] WAF, backups e requisitos corporativos revisados antes de inserir dados reais.

**Conclusão:** somente avance ao uso público/corporativo após aprovação das verificações de segurança e do banco real.
