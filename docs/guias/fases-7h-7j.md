# Fases 7H e 7J + feedback de artigos

Escopo fechado: **estabilidade/manutenção**, **indicadores administrativos** e
a pergunta **“Este artigo resolveu seu problema?”**. Não inclui importação de conteúdos,
chat com Ctrl+V, ampliação de imagens nem outras fases.

## Implantação segura (sem migração automática)

1. Faça backup/snapshot do Neon do ambiente **Preview** e execute integralmente
   [db/009_fases_7h_7j_feedback.sql](../../db/009_fases_7h_7j_feedback.sql)
   **após a migração 008**. SQL idempotente, aditivo e transacional.
2. Teste como leitor: votar sim e não no artigo, alterar resposta, recarregar,
   não conseguir enviar feedback para artigos sem permissão.
3. Teste como administrador: `/admin/indicadores` e `/admin/manutencao`;
   leitor/editor não podem abrir essas páginas e nem executar manutenção pela API.
4. Teste no Preview: mensagens com imagem, exclusão global (entra na fila),
   exclusão individual e limpeza de conversa (não entram na fila),
   manutenção com autorização do administrador.
5. O código é compatível com a produção **antes** da migração: o chat, busca,
   leitura de artigos e upload continuam funcionando, enquanto feedback, indicadores
   e manutenção ficam temporariamente indisponíveis. Mesmo assim, prefira testar
   a migração 009 em Preview, confirmar backup/rollback e aplicá-la em Production
   antes de habilitar os novos recursos. O app detecta as tabelas na requisição,
   sem exigir novo deploy após executar o SQL. A Vercel não aplica SQL automaticamente.
6. Um trigger criado pela 009 registra no banco as imagens apagadas para todos,
   sem depender da versão do código do chat. A migração também recupera imagens
   apagadas antes de sua aplicação, preservando imagens ocultas apenas para si.

Verificação SQL, **somente leitura**:

```sql
SELECT current_database() AS banco,
  to_regclass('public.kb_artigo_feedback') AS feedback,
  to_regclass('public.kb_buscas_sem_resultado') AS lacunas,
  to_regclass('public.kb_busca_estatistica_limites') AS cota,
  to_regclass('public.kb_chat_imagens_limpeza') AS fila_limpeza;
```

## Política de retenção e segurança (7H)

- Todo envio de imagem usa Blob privado e autorização na leitura.
- **Apagar para todos** oculta a mensagem e, após a migração 009, um trigger
  inclui o arquivo na fila **na mesma transação SQL**, mesmo que o app ainda use
  o backend anterior. Uma imagem apagada não é mais servida pela API.
- **Apagar para mim** e **limpar conversa** não colocam conteúdo na fila, pois
  outros participantes podem manter acesso.
- Um administrador pode executar manualmente lotes de até **10 objetos**, com
  trava temporária, nova conferência de vínculo e tentativas repetíveis.
  Repetição é segura após falha de rede, e nunca apaga um Blob de mensagem ainda ativa.
- A limpeza também remove tokens de sessão e limites de login **expirados**.
- Antes de aplicar a 009, a manutenção e os indicadores mostram claramente que
  a migração está pendente, e o feedback não aparece; não há consultas em tabelas ausentes.
- Nenhuma exclusão periódica automática de histórico, anexos ou dados de auditoria.
  Defina com a equipe o prazo de retenção de mensagens antes de implementar isso.
- Confira a política de backup/PITR contratada no **Neon**, faça snapshot antes
  de migrações e teste uma **restauração isolada**. A aplicação não cria backups do Neon
  e imagens Blob exigem estratégia própria de recuperação.
- Verifique alertas e logs no painel Vercel. Nenhum endpoint público de diagnóstico
  ou manipulação de backup é exposto.

## Indicadores (7J)

- **Leitores distintos com acesso recente**: `kb_leituras` (última leitura por
  par usuário/artigo), **não é contagem de pageviews**.
- **Artigos com mais leitores**: agrupado por URL, período de 30 dias.
- **Atividade editorial**: eventos de criação/edição nos últimos 30 dias.
- **Feedback sim/não**: uma resposta atual por usuário e artigo, editável,
  contabilizada apenas de forma agregada.
- **Lacunas**: buscas explícitas sem resultado rechecadas no servidor, com
  validação restritiva do termo, **sem salvar usuário/IP na tabela de lacunas**,
  e limite de uma gravação a cada 15 s por conta. E-mails, URLs e algumas sequências
  numéricas são descartados. Esse filtro reduz riscos, mas **não garante** que uma
  pesquisa em linguagem natural nunca contenha informação pessoal.
- **Revisão**: artigos vencidos e obsoletos do índice que o administrador consulta.

Os indicadores e as rotas administrativas são exclusivos do perfil administrador.
Nenhum dashboard expõe quem votou em um artigo ou o conteúdo de mensagens.

## Testes

```bash
npm run testar:fases-7h-7j
npm run verificar:revisao
```

Os testes locais rodam com PGlite e não exigem Neon, Blob nem sessão real.
Validar o Preview com duas contas e Blob real antes de integrar.

## Limitações conhecidas

- O histórico de mensagens continua persistido após “apagar para todos”;
  o texto é substituído, e o arquivo é removido posteriormente pela fila.
- A revisão do artigo usa metadados disponíveis e pode exigir decisão editorial.
- Monitoramento avançado/alertas configuráveis e backups automatizados não foram
  implantados nem podem ser validados apenas pelos testes automatizados.
