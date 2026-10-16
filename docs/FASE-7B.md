# Nortesys KB — Fase 7B (recursos e refinamento)

**Status:** pronta para homologação local e Preview. Não fazer merge na `main` antes dos testes.

## Implementado

- **7B.1:** editor Markdown com barra de formatação, pré-visualização e rascunho temporário por aba (sessionStorage).
- **7B.2:** quatro tipos de conteúdo e modelos validados: solução de problema, tutorial, guia técnico e FAQ. Artigos sem `tipo` continuam sendo tratados como solução.
- **7B.3:** favoritos persistidos por usuário, registro de artigos visitados e páginas `/favoritos` e `/recentes`.
- **7B.4:** busca e biblioteca com filtro por tipo e ordenação.
- **7B.5:** etiquetas de tipo, confirmação de ações administrativas e filtros para auditoria.
- **7B.6:** autorização server-side para interações, verificação de origem em POST e validação de existência/visibilidade do artigo; checklist de regressão.

## Limites intencionais

- O editor é **Markdown com prévia**, não um editor WYSIWYG pleno. Rascunhos automáticos ficam apenas nesta aba (sessionStorage), não sincronizam entre dispositivos. Para persistir no Neon, use **Salvar** no formulário (com status Rascunho).
- As imagens exibidas no conteúdo precisam estar em `/public/imagens` e ser referenciadas por caminhos locais `/imagens/arquivo.webp`. Upload direto pelo navegador requer storage de objetos configurado e não foi incluído; não se deve armazenar arquivos binários arbitrários no PostgreSQL.
- Os modelos de categorias e as URLs de artigos permanecem como eram; mudança de tipo exige revisar/substituir os títulos das seções. Artigos legados continuam válidos.
- Favoritos e leituras só listam artigos acessíveis ao perfil atual; URLs antigas removidas são omitidas.

## Instalação no Git Bash

```bash
git switch -c fase-7b-recursos   # somente se ainda não existir a branch
# Extrair ZIP de atualização na raiz do projeto
npm install
npm run db:migrar
npm run db:verificar
npm run testar:fase7b
npm run verificar:fase7b
npm run dev
```

**Importante:** `db:migrar` aplica `003_interacoes.sql` no mesmo banco `DATABASE_URL` já usado pela aplicação; faça backup/branch de testes no Neon antes de aplicar. A migração cria apenas tabelas e índices, sem excluir registros. No ambiente Vercel, aplique a migração no banco da Preview antes de testar as funcionalidades novas.

Não envie `.env.local`, credenciais, tokens ou exemplos de clientes reais ao GitHub. Execute lint e build, teste com três perfis e faça implantação Preview. Somente depois faça merge.
