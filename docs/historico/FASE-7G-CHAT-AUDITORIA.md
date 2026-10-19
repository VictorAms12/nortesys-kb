# 7G.1 + 7G.2 — Chat interno e auditoria ampliada

Esta entrega continua na branch `fase-7c2-7c3-anexos-editorial`. A importação de documentos/artigos foi **removida** por ser redundante com o editor Markdown. Nenhuma alteração em produção ou no banco foi efetuada por este commit.

## Pré-requisitos — Preview

1. No Neon, selecione o **banco de testes que a Vercel Preview realmente utiliza**. Execute o arquivo **`db/006_chat.sql` inteiro** no SQL Editor, incluindo `BEGIN` e `COMMIT`. Não execute ainda em Production.
2. Na Vercel, em **Preview** (branch correta), configure `ABLY_API_KEY` com chave restrita a `kb-chat:*`, contendo **publish** e **subscribe**. A chave fica só no servidor, sem `NEXT_PUBLIC_`. A permissão **presence** é opcional nesta implementação (a presença usa heartbeat validado no Neon).
3. Faça novo deploy do commit atualizado no Preview e confirme os serviços.
4. A chave do Ably é compartilhada somente com o backend. Para a interface, o servidor gera token de duração limitada com capacidade **subscribe apenas** em `kb-chat:geral` e `kb-chat:usuario:<UUID da conta>`. A publicação sempre passa pela API autenticada do KB.
5. O navegador usa **SSE/EventSource** do Ably (recepção em tempo real) sem SDK npm; no servidor são usadas as APIs REST de token e publicação. A chave não é exposta ao cliente.

## Chat

- Chat geral e mensagens privadas persistidas em `kb_chat_mensagens`; contas individualizadas por `kb_usuarios`.
- Conversa privada tem participantes cadastrados; API de mensagens exige participação antes de retornar os dados. Usuário externo recebe 404.
- Mensagens com até 2.000 caracteres e limite de 15 envios por 30 segundos por usuário.
- Canales Ably transmitem apenas IDs e avisos de digitação; texto e histórico são servidos exclusivamente pelo banco e por API do KB.
- Presença **online**: atividade até 5 minutos e heartbeat dentro de 120 segundos; **ausente**: heartbeat recente, mas sem interação nos últimos 5 minutos; **offline**: sem heartbeat recente. É aproximação, não garantia de atenção imediata.
- Não lidas são armazenadas como `ultima_lida_id`, com indicador na barra superior. Busca de mensagens é no Neon, limitando resultados por consulta.
- Se Ably falhar, a persistência de mensagens continua, e a interface consulta periodicamente as APIs. O status de tempo real na tela indica a situação.
- Sem anexos, edição ou exclusão de mensagens nesta etapa. Links de artigos são clicáveis; não são arquivos externos enviados automaticamente.
- Não persistir informações sensíveis de clientes ou senhas nas mensagens. A equipe deve estabelecer retenção, regras de uso e política de acesso.

## Auditoria

- Login e logout bem-sucedidos; tentativas de login inválidas sem registrar login/senha informados.
- Início da criação/edição, criação/edição/arquivamento, visualização com deduplicação, favoritos, gestão de contas e anexos.
- Abertura de ferramentas e chat, criação de conversas privadas e envio de mensagens (sem texto).
- Painel `/admin/auditoria`, somente administradores, com filtros por evento, usuário, datas e paginação.
- Não registrar cada clique, movimento do mouse, batimento de presença ou digitação; esses eventos seriam barulhentos e invasivos.
- Auditoria não grava corpo de mensagens, dados fiscais de clientes, senhas, tokens ou PDFs.

## Verificação SQL (somente SELECT)

```sql
SELECT current_database() AS banco,
  to_regclass('public.kb_chat_conversas') AS conversas,
  to_regclass('public.kb_chat_participantes') AS participantes,
  to_regclass('public.kb_chat_mensagens') AS mensagens,
  to_regclass('public.kb_chat_presenca') AS presenca,
  to_regclass('public.kb_chat_limites') AS limites;
SELECT id,tipo,chave FROM kb_chat_conversas WHERE chave='geral';
```

## Testes funcionais com duas contas

1. Entre com duas contas diferentes, cada uma em um navegador. Observe se ambas aparecem **online**.
2. Envie uma mensagem no **Geral** e confirme entrega instantânea ou, se indisponível, atualização periódica. Confira o histórico após recarregar.
3. Inicie uma conversa privada, envie mensagem e confira o contador de não lidas na outra conta, dentro e fora da tela de chat.
4. Abra `/api/chat/mensagens?conversa=UUID_PRIVADO` com a conta de um terceiro que não participa. Deve retornar 404.
5. Verifique busca no histórico, indicador de digitação, status **ausente** por inatividade e **offline** quando a aba for fechada (até 120 segundos).
6. Confira em `/admin/auditoria` login/logout, início de edição, criação e envio de mensagem. Nenhum texto privado deve aparecer.
7. Como leitor, confirme que `/admin/auditoria` está bloqueada.

## Testes sem serviços reais

```bash
npm ci
npm run testar:chat
npm run verificar:revisao
npm run build:revisao
```

### Produção
**Não dar merge ainda.** Antes do merge, aplicar `db/006_chat.sql` na conexão Production correta, configurar uma API Key Ably de produção (preferencialmente aplicativo Ably separado) e testar. A migração 005 dos PDFs também precisa existir no Production se o PR ainda incluir essa entrega.
