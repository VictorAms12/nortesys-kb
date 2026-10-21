# Imagens nas conversas (branch feat/chat-envio-imagens)

O chat permite enviar **uma imagem PNG/JPEG/WebP de até 2 MB** por mensagem, com legenda opcional, no canal geral ou em conversas privadas. Usa o Blob privado já configurado no projeto, normaliza o arquivo com Sharp para rejeitar formatos inválidos e remover metadados e aplica a cota de mensagens existente. As imagens não recebem URL pública: são servidas em `/api/chat/imagens/:id` após autenticação e checagem de participação, ocultação individual, limpeza e exclusão global.

## Implantação

1. Fazer backup e aplicar **`db/008_chat_imagens.sql`** integralmente **no banco de Preview/desenvolvimento**, após as migrações 006 e 007.
2. Garantir que o armazenamento **Vercel Blob privado** esteja configurado no ambiente de teste.
3. Testar com duas contas: enviar no geral e no privado, abrir imagens, responder, apagar para mim, apagar para todos, limpar conversa, pesquisar, atualizar a página e verificar ausência de acesso para uma terceira conta não participante.
4. Após revisar o PR e aprovar, aplicar a mesma migração em produção **antes** do deploy. Não executar migrações automaticamente no build.

A rota de leitura devolve `Cache-Control: private, no-store` e nunca divulga URLs do Blob. Apagar para todos revoga acesso imediatamente; os objetos privados anteriormente armazenados precisam de uma política posterior de limpeza/retensão no Blob, pois o histórico continua no banco.

## Verificações

- `npm run testar:chat-imagens` valida autorização SQL e migração com PGlite.
- `npm run verificar:revisao` inclui os testes e verificações habituais.
- O teste com navegador autenticado e Blob real precisa ser realizado no Preview antes de integrar.
