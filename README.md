# Nortesys KB — Fase 7A

Base de conhecimento interna feita com Next.js 16, PostgreSQL (Neon), artigos Markdown e no banco, login individual e painel administrativo. A Fase 7A aplica sidebar unificada e redesign moderno, preservando **as cores atuais** e a lógica existente.

## Instalação — Git Bash / Windows

```bash
npm install
npm run testar:fase7a
npm run verificar:fase7a
npm run dev
```

Mantenha seu `.env.local` com `DATABASE_URL` e demais configurações necessárias. Ele **não deve** ser commitado no GitHub. A Fase 7A não altera o esquema do Neon, então não requer migração adicional.

Entre em `http://localhost:3000/entrar` e utilize o sistema. A sidebar aparece após o login, com itens conforme o perfil: leitor, editor ou administrador.

## Principais novidades

- Sidebar recolhível com grupos Conhecimento e Administração, versão mobile e estado persistido no navegador.
- Cabeçalho compacto com busca Ctrl/Cmd+K, alternância de tema e logout.
- Novas páginas gerais em `/artigos` e `/categorias`.
- Página inicial com indicadores extraídos dos artigos acessíveis e dashboard administrativo com contagens reais do Neon.
- Refinamento visual de busca, leitura de artigos, formulários, listas de artigos e auditoria.

Veja [docs/FASE-7A.md](docs/FASE-7A.md) e [docs/CHECKLIST-FASE-7A.md](docs/CHECKLIST-FASE-7A.md) para detalhes e homologação.

**Deploy:** publique primeiro em uma branch `fase-7a-redesign` e confira o Preview da Vercel antes do merge na `main`. Não inclua credenciais ou dados reais de clientes em conteúdos de teste.
