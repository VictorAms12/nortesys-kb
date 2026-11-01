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
npm run db:status
```

**Diagnóstico somente leitura:** o comando exibe o banco, o identificador da branch Neon e as migrações registradas, aplicadas sem histórico, pendentes ou incompletas. Compara assinaturas de tabelas, colunas, índices, restrições e gatilhos. **Não reaplique migrações manualmente executadas apenas porque `kb_migracoes` não existe.** O migrador agora interrompe o processo se detectar estrutura existente sem histórico confiável.

Em um banco inteiramente novo, sem tabelas `kb_*`, execute `npm run db:migrar` e `npm run db:verificar`. Para bancos existentes cujas migrações foram feitas manualmente, confira o esquema e o relatório; depois autorize a conciliação **somente na branch de desenvolvimento**. Exemplo no PowerShell para a branch atual:

```powershell
$env:KB_RECONCILIAR_BRANCH_ID="br-calm-moon-b5scqqnp"
$env:KB_RECONCILIAR_CONFIRMAR="sim"
npm run db:reconciliar
Remove-Item Env:KB_RECONCILIAR_BRANCH_ID
Remove-Item Env:KB_RECONCILIAR_CONFIRMAR
npm run db:status
```

Confirme o ID em Neon → projeto `nortesyskb` → Branches → `dev-fase-7c1`. Se recriar a branch, atualize o ID. O script exige que o ID informado corresponda ao `current_setting('neon.branch_id')` do banco realmente conectado. Ele registra checksums SHA-256 **apenas para migrações que passaram nas verificações estruturais**, sem reaplicar seus comandos; bloqueia assinaturas parciais, checksums divergentes e lacunas fora de ordem.

**Atenção:** a assinatura identifica os objetos essenciais, mas não prova que o conteúdo de todas as funções ou os dados coincidem exatamente com o SQL versionado. Revise as migrações e quaisquer alterações manuais antes de conciliar. A conciliação escreve no banco e não deve ser executada na produção sem autorização separada. Não rode migradores simultaneamente. Depois de conciliar, `npm run db:migrar` aplica apenas novas etapas pendentes e registra seus checksums em transações por arquivo.

A migração 012 permite imagens de chat sem legenda e atualiza somente textos automáticos. A 013 cria cotas para avatar (12 por hora), sugestões (90 por minuto) e índices para a central de notificações.

A **migração 014** protege o último administrador ativo por trigger no PostgreSQL, inclusive em alterações feitas fora do painel. Valide o comportamento com pelo menos dois administradores de teste antes da produção.

A **migração 015** recupera o gatilho da fila de imagens de chat excluídas para todos, sem remover arquivos ou mensagens. Se a migração 009 estiver parcialmente instalada, recupere o gatilho e verifique seu funcionamento antes de reconciliar os checksums históricos.

A **migração 016** prepara índices de pesquisa SQL: GIN para texto em português e, quando disponíveis, `pg_trgm`, `unaccent` e trigram de títulos. A busca atual continua usando Fuse.js, sem alteração na relevância.

A **migração 017** preserva vínculos quando um editor altera categoria ou slug de um artigo persistido no Neon. Ela cria a tabela `kb_artigo_aliases` e dois gatilhos no PostgreSQL, que, na **mesma transação da atualização**, migram favoritos, leituras e feedback para a URL atual. Em registros duplicados, preserva a data mais antiga do favorito, a leitura mais recente e o feedback mais recente. Os anexos e as imagens continuam vinculados ao `artigo_id`, sem alterações nesses vínculos.

URLs anteriores redirecionam para a URL atual **somente se o artigo não estiver arquivado e estiver visível ao papel autenticado**. A URL antiga permanece reservada contra criação de outro artigo; um artigo pode voltar a usar uma de suas próprias URLs antigas. Renomeações feitas **antes** da instalação da 017 não são recuperadas automaticamente: revise casos históricos manualmente, sem remapear dados de outro artigo. A resolução de aliases falha de forma compatível se 017 ainda não estiver instalada em produção.

Aplique e valide novas migrações primeiro na branch Neon de desenvolvimento; não aplique na produção sem uma verificação separada. O comando `npm run db:status` permite conferir as assinaturas, e `npm run db:verificar` confere o histórico.

Conferência SQL:

```sql
SELECT nome, aplicada_em, checksum FROM kb_migracoes ORDER BY nome;
SELECT COUNT(*) FROM kb_notificacoes;
```

## Manutenção e agendamento

Configure `CRON_SECRET` (valor aleatório com pelo menos 24 caracteres) na Vercel. O agendamento de `vercel.json` chama `/api/cron/manutencao` uma vez por dia, às 07:00 UTC (04:00 em Araguaína). O endpoint requer o cabeçalho `Authorization: Bearer <CRON_SECRET>`; sem segredo não é liberado.

A manutenção apaga sessões e tentativas expiradas, processa a fila de imagens de chat, remove notificações com mais de 30 dias e limpa cotas antigas. As exclusões de sessões, notificações e cotas usam lotes de até 200 itens por consulta e até cinco rodadas por execução, para limitar tempo e locks no Neon. Se 010/013 ainda não estiverem aplicadas, essas partes da limpeza são ignoradas sem bloquear sessões ou imagens; repita a manutenção quando as tabelas estiverem disponíveis. Ajuste a retenção com `NOTIFICACOES_RETENCAO_DIAS` (7–365; padrão 30).

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

## Limite de tamanho do cache de artigos

O cache do Next.js separa o catálogo completo por papel (`leitor`, `editor`, `administrador`) com a tag `kb-indice-busca`. Cada recálculo registra **somente o tamanho em KB do JSON**, no formato `[kb-cache-artigos] papel=... tamanho_kb=... limite_kb=1465 acima_limite=...`. Nenhum título, corpo ou dado de usuário aparece nesse registro.

O limite preventivo é **1.500.000 bytes (aproximadamente 1,5 MB)**, abaixo do teto aproximado de 2 MB por item em alguns ambientes Vercel. Com o catálogo atual abaixo do limite, mantém-se o cache completo por papel para não introduzir consultas desnecessárias; se os logs mostrarem `acima_limite=sim`, será necessário separar catálogo leve e conteúdo por URL antes de crescer mais (a divisão não é ativada automaticamente). Aferir os valores em Preview e produção após uma requisição que cause cache miss.

**Edições feitas pelo painel** invalidam a tag imediatamente nas ações criar, salvar e arquivar. **Alterações realizadas diretamente no Neon** não disparam essa invalidação; podem levar **até cinco minutos** para aparecer pelo prazo `revalidate:300`. A cache nunca mistura rascunhos de editores com o catálogo de leitores.

## Senhas versionadas (migração 019)

A migração 019 adiciona `senha_hash_v2`, preservando `senha_hash` para contas antigas. Novas senhas usam `scrypt$v2$131072$8$1$<hash>` com sal individual de 16 bytes e marcador legado aleatório não derivado da senha. Logins de contas antigas executam rehash atômico após autenticação, sem alterar a versão da sessão. Hash versionado inválido nunca faz fallback para legado.

Medição de referência em Node.js 22 no ambiente de desenvolvimento: `scrypt` N=2^17, r=8, p=1 e 256 MiB de limite de memória levou aproximadamente **532–642 ms** por derivação. **Não foi aferido em runtime Serverless Vercel**: medir latência, memória e concorrência em Preview antes de publicar. Aplicar `018` e `019` no banco de Preview antes de testar login, cadastro e redefinição de senhas; não executar em produção nesta PR.
