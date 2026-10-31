# Testes funcionais no navegador (Fase C)

Os testes de fumaça verificam **comportamento real** sem pesquisar strings no CSS ou no código-fonte: login, busca com a tecla `/`, abertura de artigo, envio de mensagem, central de notificações e logout.

## Isolamento e segurança

Utilize **somente Preview ou localhost conectado a um branch de desenvolvimento do Neon**. Crie um usuário de testes com acesso ao chat e publique nele um artigo de teste visível ao usuário. O teste do chat **grava uma mensagem real**, identificada por prefixo `Teste de fumaça KB`. A central não marca avisos como lidos, e o logout encerra apenas a sessão de teste. Não use credenciais de produção.

Como solicitado, o repositório **não ganhou dependências npm novas**. Para executar os arquivos Playwright, disponibilize `@playwright/test` no ambiente de testes de forma externa ou temporária, sem alterar os manifests do projeto. Exemplo local, com instalação temporária que não modifica `package.json` nem `package-lock.json`:

```bash
npm ci
npm install --no-save --package-lock=false --ignore-scripts @playwright/test
npx playwright install chromium
```

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

O runner não faz parte do CI padrão: **a execução requer navegador, conta autenticada e Neon de teste**, indisponíveis na verificação sem segredos. Sem as variáveis obrigatórias, os testes falham explicitamente em vez de serem marcados como aprovados por omissão.

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
