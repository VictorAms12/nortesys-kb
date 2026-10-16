# Nortesys KB — Fase 5.5

Base de conhecimento interna Next.js 16 com busca Fuse.js, artigos em Markdown, autenticação individual em PostgreSQL e papéis (`administrador`, `editor`, `leitor`).

## Configuração rápida (Windows / PowerShell)

1. Extraia o projeto na pasta de trabalho. Instale Node.js compatível com `package.json`.
2. Configure a connection string fornecida pelo Neon no `.env.local`:

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run db:migrar
npm.cmd run db:verificar
npm.cmd run usuario:adicionar -- admin "Administrador Nortesys" administrador
npm.cmd run verificar:fase55
npm.cmd run dev
```

3. Acesse `http://localhost:3000/entrar` com o usuário e a senha gerados no terminal. Não compartilhe o arquivo `.env.local` nem senhas.

## Migração de contas

Se já usou `KB_USERS` na Fase 5, mantenha essa variável temporariamente na `.env.local` e execute `npm.cmd run usuario:migrar` **após** a criação das tabelas. Contas importadas ficam como `leitor` e mantêm a senha anterior. Veja as instruções completas em [docs/FASE-5.5-POSTGRESQL.md](docs/FASE-5.5-POSTGRESQL.md).

## Comandos importantes

- `npm run db:migrar` — cria as tabelas de autenticação.
- `npm run db:verificar` — confere acesso ao banco e total de contas.
- `npm run usuario:adicionar -- nome "Nome Completo" leitor` — cria conta.
- `npm run usuario:listar` — relaciona usuários e papéis.
- `npm run usuario:senha -- nome` — redefine senha e revoga sessões.
- `npm run usuario:papel -- nome editor` — altera papel.
- `npm run usuario:desativar -- nome` — suspende conta.
- `npm run usuario:ativar -- nome` — reativa conta.
- `npm run usuario:migrar` — importa credenciais antigas da variável `KB_USERS`.
- `npm run verificar:fase55` — valida estrutura, scanner, testes locais, lint e build.

## Segurança

Sessões revogáveis armazenadas apenas como hash SHA-256 no banco; cookies HttpOnly, SameSite Strict e Secure em produção; cinco tentativas de login por usuário em 15 minutos registradas no PostgreSQL. Complementar com WAF e políticas corporativas antes de uso com dados reais. A conexão ao banco é usada apenas no servidor.

Artigos permanecem em `content/` e continuarão sendo editados por arquivos Markdown até a Fase 6. Ainda não há painel administrativo. Faça sempre backup do banco e trabalhe com Preview protegido na Vercel antes do lançamento.
