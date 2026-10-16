# Nortesys KB — Fase 6

Base de conhecimento interna com Next.js 16, artigos Markdown e PostgreSQL (Neon), busca Fuse.js, login por usuário e painel administrativo.

## Instalação (Windows/PowerShell)

Na pasta do projeto, preserve o `.env.local` contendo a `DATABASE_URL` já cadastrada na Fase 5.5. Em seguida:

```powershell
npm.cmd install
npm.cmd run db:migrar
npm.cmd run db:verificar
npm.cmd run testar:fase6
npm.cmd run verificar:fase6
npm.cmd run dev
```

Entre em `http://localhost:3000/entrar` com uma conta **administrador** e acesse `http://localhost:3000/admin`. O comando `db:migrar` aplica as migrações antigas e a nova `db/002_painel.sql` sem apagar usuários existentes.

## Funcionalidades

- **Administrador:** usuários, permissões, ativação/desativação, redefinição de credenciais, auditoria, artigos e histórico.
- **Editor:** gestão de artigos, rascunhos, publicação, arquivamento e histórico.
- **Leitor:** consulta e busca de procedimentos publicados.
- Artigos antigos de `content/` seguem sendo lidos do Git; os criados via painel ficam no PostgreSQL.

## Informações importantes

Não existe cadastro público. Não inclua segredos, dados reais de clientes ou documentos confidenciais em artigos de teste. Use repositório privado e banco Preview isolado para a primeira implantação Vercel.

Confira [docs/FASE-6.md](docs/FASE-6.md) para o guia completo e [docs/CHECKLIST-FASE-6.md](docs/CHECKLIST-FASE-6.md) para homologação.
