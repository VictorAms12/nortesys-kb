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
| `ABLY_API_KEY` | Chave privada do Ably para notificação em tempo real no chat; opcional para carregamento somente por consultas ao Neon |

O SDK resolve a autenticação do Blob. Para OIDC no desenvolvimento, utilize o fluxo de credenciais de desenvolvimento da integração Vercel; apenas informar o ID do store não fornece uma identidade. Não copie tokens de sessão do navegador para o projeto. Nenhuma dessas variáveis deve usar o prefixo `NEXT_PUBLIC_`.

`.env.vercel-development.local` é um arquivo auxiliar local; o nome, sozinho, não faz o Next.js carregá-lo. A aplicação local usa `.env.local` ou as variáveis do processo. Na Vercel, configure o ambiente no painel do projeto.

## Migrações do banco

Configure **somente o Neon de desenvolvimento** em `.env.local` e confira o ambiente antes de prosseguir. Não execute migrações de Preview diretamente no banco de produção.

```bash
npm run db:migrar
npm run db:verificar
```

O runner percorre **todos os arquivos `db/NNN_*.sql` em ordem** (incluindo 010, 011, 012 e 013), usa transação por arquivo e registra nome, data e SHA-256 em `kb_migracoes`. Migrações registradas são ignoradas, e qualquer checksum divergente interrompe o processo. SQL com funções PL/pgSQL, aspas ou comentários não é dividido incorretamente. Não execute dois runners simultaneamente.

**Banco já existente:** na primeira execução, os arquivos antigos ainda não possuem entradas em `kb_migracoes`. Eles são reaplicados com suas proteções idempotentes, sem excluir registros. Confira as migrações e os triggers em desenvolvimento antes de autorizar o mesmo procedimento em produção.

A migração 012 permite imagens de chat sem legenda e atualiza somente textos automáticos. A 013 cria cotas para avatar (12 por hora), sugestões (90 por minuto) e índices para a central de notificações.

A **migração 014** protege o último administrador ativo por trigger no PostgreSQL, inclusive em atualizações simultâneas ou operações feitas fora do painel. Aplique-a primeiro no Neon de desenvolvimento e valide a ativação, rebaixamento e desativação de contas com pelo menos dois administradores de teste. O controle de concorrência entre conexões reais precisa ser homologado no banco escolhido. O deploy do código da Fase B precisa ocorrer **após aplicar as migrações em Preview**.

Conferência SQL:

```sql
SELECT nome, aplicada_em, checksum FROM kb_migracoes ORDER BY nome;
SELECT COUNT(*) FROM kb_notificacoes;
```

## Manutenção e agendamento

Configure `CRON_SECRET` (valor aleatório com pelo menos 24 caracteres) na Vercel. O agendamento de `vercel.json` chama `/api/cron/manutencao` uma vez por dia, às 07:00 UTC (04:00 em Araguaína). O endpoint requer o cabeçalho `Authorization: Bearer <CRON_SECRET>`; sem segredo não é liberado.

A manutenção apaga sessões e tentativas expiradas, processa a fila de imagens de chat, remove notificações com mais de 30 dias e limpa cotas antigas. Ajuste a retenção com `NOTIFICACOES_RETENCAO_DIAS` (7–365; padrão 30).

Para notificações Web Push configure `WEB_PUSH_SUBJECT` com um endereço `mailto:` válido ou a URL HTTPS do domínio real da aplicação, além das chaves VAPID. Sem assunto válido o Push permanece desativado, mas o chat e as notificações internas continuam funcionando.

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

## Chat (Fases 7G.1 e 7G.2)

Em banco de Preview, execute `db/006_chat.sql` inteiro no SQL Editor após 001 e 002, incluindo transação. Configure `ABLY_API_KEY` restrita a `kb-chat:*` com publish e subscribe. As mensagens ficam no Neon; o Ably é usado para eventos sem texto privado. Confira [a checklist do chat](../historico/FASE-7G-CHAT-AUDITORIA.md).
