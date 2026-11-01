# Contribuindo com a Nortesys KB

## Preparação

Siga o [guia de configuração](docs/guias/configuracao.md). Use um banco de desenvolvimento e uma branch de trabalho a partir da `main` atualizada.

```bash
git switch main
git pull --ff-only
git switch -c melhoria/nome-da-alteracao
npm ci
```

## Código e organização

- Páginas e endpoints ficam em `src/app/`; componentes reutilizáveis em `src/components/`.
- Regras de negócio e integrações ficam em `src/lib/`. Mantenha credenciais e operações privilegiadas no servidor.
- Ferramentas operacionais ficam em `scripts/`; testes em `tests/`.
- Atualize os guias em `docs/guias/` quando mudar configuração ou operação. `docs/historico/` registra etapas anteriores.
- Migrações ficam em `db/`, numeradas. Uma nova migração deve documentar a forma de aplicação e seus pré-requisitos.

Preserve autorização, validação de origem, limites de upload e consistência entre artigo e histórico. Considere teclado, foco, telas pequenas e movimento reduzido ao alterar a interface.

## Conteúdo técnico

O painel permite criar e editar artigos no banco. Para conteúdo versionado em Markdown, utilize os modelos existentes em `content/`, respeite o frontmatter e as seções do tipo de artigo e execute:

```bash
npm run validar:artigos
npm run verificar
```

Prefira exemplos fictícios. Não inclua credenciais, dados de clientes nem capturas com informações pessoais. A leitura de imagens estáticas em `public/` não possui a autorização por artigo dos uploads privados.

## Validação e revisão

```bash
npm ci
npm run verificar:regras
npm run lint
npm run format:check
npm run typecheck
npm run testar:e2e:listar
npm run build:revisao
node tests/testar-build-revisao.mjs build/revisao-IDENTIFICADOR
```

Substitua o identificador pelo diretório impresso pelo build. Esses comandos não aplicam SQL no banco real.

O GitHub Actions executa essas verificações em pull requests contra `main` e em pushes para `main`. O `npm audit` é apenas informativo (não bloqueia a PR). O Dependabot abre PRs semanais de dependências npm e GitHub Actions para revisão; **não faça merge automático** sem testes. Para executar realmente os seis testes Playwright, use exclusivamente usuário, artigo, armazenamento e Neon isolados de desenvolvimento conforme [guia de navegador](docs/guias/testes-navegador.md).

A formatação básica está separada de ESLint e TypeScript. Para aplicar o **Prettier** opcionalmente aos arquivos de SQL e configuração da Fase 6, use `npm run format:prettier`. O Prettier é executado via `npx` e não se torna dependência permanente; somente `@playwright/test` foi acrescentado ao `devDependencies`.

Na descrição da alteração, explique o problema, o comportamento final e a validação feita. Para mudanças visuais ou integrações externas, valide também os fluxos afetados no Preview. Inclua qualquer nova variável ou migração necessária antes da integração na `main`.
