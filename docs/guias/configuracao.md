# Configuração local

## Dependências e ambiente

Na raiz do repositório, com Node.js 20.9+ e npm:

```bash
npm ci
```

Copie [`.env.example`](../../.env.example) para `.env.local`. No PowerShell, pode usar `Copy-Item .env.example .env.local` se o destino ainda não existir. Se já existir, edite somente as configurações necessárias.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL do Neon com `sslmode=require`; necessária para autenticação e persistência |
| `BLOB_STORE_ID` | Identifica o store no fluxo OIDC da integração Vercel Blob |
| `BLOB_READ_WRITE_TOKEN` | Alternativa de autenticação para integrações Blob que utilizem token estático |

O SDK resolve a autenticação do Blob. Para OIDC no desenvolvimento, utilize o fluxo de credenciais de desenvolvimento da integração Vercel; apenas informar o ID do store não fornece uma identidade. Não copie tokens de sessão do navegador para o projeto. Nenhuma dessas variáveis deve usar o prefixo `NEXT_PUBLIC_`.

`.env.vercel-development.local` é um arquivo auxiliar local; o nome, sozinho, não faz o Next.js carregá-lo. A aplicação local usa `.env.local` ou as variáveis do processo. Na Vercel, configure o ambiente no painel do projeto.

## Banco inicial

Escolha o banco de desenvolvimento e confira se é o mesmo apontado por `DATABASE_URL`.

```bash
npm run db:migrar
```

Esse comando aplica somente:

1. [001_auth.sql](../../db/001_auth.sql): contas, sessões e tentativas de login.
2. [002_painel.sql](../../db/002_painel.sql): artigos, versões e auditoria.
3. [003_interacoes.sql](../../db/003_interacoes.sql): favoritos e leituras.

Depois, execute **[004_imagens.sql](../../db/004_imagens.sql) inteiro** no SQL Editor do banco escolhido, incluindo `BEGIN` e `COMMIT`. Não passe esse arquivo pelo separador de instruções do CLI: ele contém uma função PL/pgSQL.

O aviso de que o trigger não existia durante `DROP TRIGGER IF EXISTS` é esperado na primeira execução. Confirme que o restante foi concluído e que a transação foi confirmada.

Consulta de conferência, sem alterar dados:

```sql
SELECT current_database() AS banco,
       to_regclass('public.kb_imagens') AS imagens,
       to_regclass('public.kb_imagem_limites') AS limites,
       to_regprocedure('public.kb_associar_imagens_artigo()') AS funcao;

SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = to_regclass('public.kb_artigos')
  AND tgname = 'kb_artigos_associar_imagens'
  AND NOT tgisinternal;
```

As três referências da primeira consulta devem estar preenchidas. A segunda deve retornar o trigger habilitado (`O` no padrão). Essas consultas confirmam a presença dos objetos; o teste de upload e salvamento valida o fluxo completo. `npm run db:verificar` confere conectividade e contagens de usuários/artigos, mas não verifica toda a migração de imagens.

## Primeira conta e execução

```bash
npm run usuario:adicionar -- admin "Administrador" administrador
npm run dev
```

Guarde a senha inicial exibida pelo CLI e abra http://localhost:3000. As contas seguintes também podem ser gerenciadas pelo administrador no painel.

Outros comandos operacionais:

```bash
npm run usuario:listar
npm run usuario:senha -- admin
npm run usuario:papel -- usuario editor
npm run usuario:desativar -- usuario
npm run usuario:ativar -- usuario
npm run db:limpar
```

Todos usam `.env.local`. `usuario:senha` gera uma nova senha e revoga as sessões anteriores; `db:limpar` remove sessões e contadores de login expirados. O importador `usuario:migrar` existe apenas para contas antigas armazenadas em `KB_USERS`. Contas atuais e sessões ficam no banco; `KB_SESSION_SECRET` não é necessário.

## Imagens

Configure um **store privado**. O editor envia para `/api/admin/imagens`; arquivos PNG, JPEG e WebP de até 2 MiB são validados e normalizados no servidor. O banco controla o limite de 20 tentativas por usuário por janela de uma hora.

O navegador recebe `/api/imagens/UUID`. O servidor confere sessão, estado e vínculo com o artigo antes de entregar os bytes. Um upload ainda sem artigo só pode ser lido pelo autor com perfil editorial.

Referências antigas em `/imagens/...` continuam sendo renderizadas. Arquivos estáticos não ganham automaticamente a proteção por artigo dos uploads privados. O protótipo `/api/admin/imagens-local` foi removido; os arquivos locais existentes foram preservados.

## Validação sem serviços reais

```bash
npm run verificar:revisao
npm run build:revisao
node tests/testar-build-revisao.mjs build/revisao-IDENTIFICADOR
```

Use o diretório indicado pelo build. O snapshot não copia arquivos `.env` nem uploads locais e remove as variáveis de serviços do processo filho. Os testes de imagens usam PostgreSQL em memória e armazenamento simulado. Nenhuma migração é executada no Neon por esses comandos.

A checagem de tipos regenera `next-env.d.ts` e os tipos de rotas com `next typegen`. Essa etapa lê a configuração local do Next, mas não executa consultas no banco. Se remover ou renomear rotas e houver erros em `.next/dev/types`, encerre o servidor de desenvolvimento e regenere o cache do Next antes de repetir a checagem.
