# Fase 7G.3 — Ações em mensagens e limpeza de conversa

## Alterações

- **Responder**: associa a nova mensagem à mensagem original. A referência só é permitida se ambas pertencem à mesma conversa e o usuário ainda tem acesso ao conteúdo original.
- **Apagar para mim**: ocultação vinculada a `(usuario_id, mensagem_id)`; não altera a visualização de outros participantes.
- **Apagar para todos**: permitido apenas ao autor, autenticado na API. O texto armazenado é substituído por `[Mensagem apagada]` e a data da exclusão é preservada.
- **Limpar conversa**: eleva `limpa_ate_id` somente do participante atual. Novas mensagens continuam chegando.
- Respostas a mensagens ocultas, apagadas para todos ou anteriores à limpeza não revelam seu texto original.
- Contadores de mensagens não lidas e prévias na lateral respeitam as remoções de cada participante.
- Atualização em tempo real via Ably, sem enviar o conteúdo das mensagens nos eventos, com fallback do histórico no Neon.
- Confirmações antes de excluir/limpar e auditoria de operação, sem registrar o texto.

## Migração necessária

**Não executar a migração pelo processo de build.** Aplicar `db/007_chat_acoes.sql` no Neon do ambiente correspondente **antes** do deployment desse código. Ela é aditiva e idempotente; não apaga mensagens nem conversas existentes.

Validação com SQL somente leitura:

```sql
SELECT current_database() AS banco,
  to_regclass('public.kb_chat_mensagens_ocultas') AS ocultacoes;
SELECT column_name
FROM information_schema.columns
WHERE table_name IN ('kb_chat_mensagens','kb_chat_participantes')
 AND column_name IN ('respondendo_a_id','apagada_para_todos_em','limpa_ate_id')
ORDER BY column_name;
```

Para produção, validar também se as migrações 005 e 006 já existem no banco correspondente. Nenhuma nova variável Ably ou Vercel foi adicionada.

## Validação com contas distintas

1. Usuário A envia uma mensagem, B responde; a referência é exibida para ambos.
2. B apaga a mensagem de A **para mim**; A continua enxergando, enquanto B deixa de ver inclusive as prévias.
3. A apaga sua mensagem **para todos**; ambos recebem a indicação “Mensagem apagada”. B não consegue executar a mesma ação em mensagens de A.
4. Limpar conversa como B não altera o histórico de A. Uma nova mensagem enviada por A volta a aparecer para B.
5. Contagem de não lidas, busca, histórico, atualização em tempo real e páginas anteriores continuam funcionando.
6. Validar também a conversa Geral e o comportamento em duas abas da mesma conta.

Testes sem Neon real: `npm run testar:chat-acoes` e `npm run verificar:revisao`, incluindo PGlite, ESLint e TypeScript.
