# Testes funcionais no navegador (Fase 6)

Os testes de fumaça verificam **comportamento real** sem pesquisar strings no CSS ou no código-fonte: login, busca com a tecla `/`, abertura de artigo, envio de mensagem, central de notificações e logout.

## Isolamento e segurança

Utilize **somente Preview ou localhost conectado a um branch de desenvolvimento do Neon**. Crie um usuário de testes com acesso ao chat e publique nele um artigo de teste visível ao usuário. O teste do chat **grava uma mensagem real**, identificada por prefixo `Teste de fumaça KB`. A central não marca avisos como lidos, e o logout encerra apenas a sessão de teste. Não use credenciais de produção.

O `@playwright/test` está versionado como **única nova dependência de desenvolvimento** desta revisão, incluindo o lockfile. Instale as dependências e o Chromium no ambiente de testes:

```bash
npm ci
npx playwright install chromium
```

O runner não grava credenciais no projeto e não utiliza o banco de produção.

Defina no terminal, **sem gravar senha em arquivo versionado**:

| Variável | Exemplo/uso |
| --- | --- |
| `E2E_BASE_URL` | `http://127.0.0.1:3000` (padrão) ou Preview isolado |
| `E2E_USUARIO` | Usuário descartável criado no Neon de desenvolvimento |
| `E2E_SENHA` | Senha do usuário descartável |
| `E2E_ARTIGO_TERMO` | Palavra que retorne um artigo disponível em sugestões e na busca |
| `E2E_ARTIGO_URL` | `/artigos/cadastros/cliente-duplicado` se esse artigo existir |
| `E2E_CONFIRM_DEVELOPMENT` | `sim` obrigatório para URL remota |
| `E2E_START_SERVER` | `1` para iniciar o Next.js local automaticamente |

Execute:

```bash
npm run testar:e2e
```

O CI faz `npm run testar:e2e:listar`, verificando se os **seis cenários** são descobertos, sem abrir o navegador nem usar credenciais. A execução de verdade depende de navegador, usuário e banco de desenvolvimento isolado; não é executada automaticamente no CI sem esses requisitos. Se as variáveis faltarem, a suíte falha explicitamente ao iniciar a execução, sem simular sucesso.

Artefatos temporários ficam em `.local/playwright-results`, fora do versionamento, e capturas/traces estão desativados por padrão para reduzir o risco de registrar dados privados.

## Verificação sem serviços externos

```bash
npm run verificar:revisao
npm run lint
npx tsc --noEmit
```

O fluxo sem segredos mantém testes unitários e de integração com PostgreSQL em memória para validações de segurança, regras de negócio, chat, notificações, uploads e migrações SQL. Esses testes **não substituem** os de navegador.

## Cuidados com falhas

Quando um teste falhar, confira primeiro se o artigo de exemplo está publicado, se o usuário tem acesso ao chat, se a migração correspondente foi aplicada no Neon de desenvolvimento e se o Preview está ligado ao banco correto. Não relaxe os seletores nem aumente timeouts para ocultar falhas reais de funcionalidade.
