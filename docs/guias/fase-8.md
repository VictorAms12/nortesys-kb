# Fase 8 — interface, chat, notificações e perfis (Preview)

Este trabalho está na branch `feat/fase-8-repaginacao-comunicacao`, em PR draft.
**Não integrar à `main` até o aceite no Preview.**

## Banco de dados

Projeto Neon: `nortesyskb`, branch `dev-fase-7c1` (`br-calm-moon-b5scqqnp`).
O SQL aditivo `db/010_perfis_notificacoes.sql` foi aplicado no Preview.
**A branch production do Neon não foi alterada.**

O SQL 010 cria campos de apresentação, avatar e preferências, o histórico de
notificações por destinatário com trigger na inserção de mensagens e a lista
de assinaturas de Web Push por dispositivo. A migração é reexecutável.

## Recursos da interface

- Sidebar e navegação preservadas com novas transições discretas;
- mensagens e contatos do chat com feedback visual, sem alterar o cálculo
  de altura do compositor ou sua rolagem;
- central no cabeçalho com contagem da aba, histórico, marcar como lida
  e toast de novas mensagens;
- tempo real com Ably fora da rota de chat e polling de recuperação;
- perfil do usuário, biografia, preferências sincronizadas no banco,
  upload de avatar para Blob privado, consulta ao perfil dos colaboradores;
- alertas opcionais do navegador sem texto de conversas privadas.

## Ativação do Web Push

O Web Push com o site fechado exige, adicionalmente às variáveis atuais:

- `WEB_PUSH_PUBLIC_KEY`: chave P-256 pública, uncompressed, base64url;
- `WEB_PUSH_PRIVATE_KEY`: chave P-256 privada de 32 bytes, base64url.

Crie um par exclusivo para a aplicação e configure **somente Preview** nas
variáveis de ambiente da Vercel. A chave privada nunca deve ser enviada ao
repositório, ao banco ou para o navegador. Faça um novo build Preview para
incorporar a configuração.

Em Perfil, clique em **Autorizar navegador**, conceda a permissão, aguarde
o registro do dispositivo e **Salve as preferências**. O serviço de push
recebe apenas um evento sem payload; o service worker gera aviso genérico.
Se as chaves estiverem ausentes ou o navegador não suportar Push API,
o recurso permanece desligado sem afetar chat ou avisos internos.

O push é best-effort, não garantia de entrega. O navegador/SO pode restringir
notificações em segundo plano. Como parte da homologação, teste Chrome,
Firefox e dispositivos móveis usados pela equipe.

## Segurança e regras

- Toda consulta/alteração de perfil e notificações exige sessão.
- Apenas mensagens para participantes geram registros de notificação.
- O texto de mensagens privadas não entra nos eventos push ou no toast externo.
- Endpoints push são limitados a serviços conhecidos para evitar SSRF.
- Avatar é armazenado em Blob privado e servido com autenticação.
- O site não expõe tokens Ably ou segredos de push do servidor em logs.
- O chat e os artigos atuais não dependem de nenhuma atualização funcional da Fase 8.

## Validação

Execute `npm run verificar:revisao` e consulte os checks do PR.
No Preview, teste com duas contas em navegadores separados: envio e leitura,
chat em abas diferentes, notificações privadas e gerais, clique do sino,
marcação como lidas, foto, permissões e preferência por movimento reduzido.

Antes de qualquer deploy em Production será necessário aplicar `db/010_perfis_notificacoes.sql`
à branch Production do Neon com backup confirmado. Ainda não autorizado neste trabalho.

A revisão visual autenticada e a confirmação do Web Push no navegador real são
passos de homologação; build READY não comprova esses cenários.

## Correções de confiabilidade posteriores

- A API usa IDs de notificação `BIGINT` como strings; o usuário só pode
  marcar notificações da própria conta como lidas.
- O contador considera todos os avisos visíveis, enquanto a lista mostra os
  40 mais recentes. Mensagens apagadas, ocultadas ou anteriores a uma limpeza
  de conversa não aparecem nos avisos.
- Ao ler ou limpar uma conversa, o backend sincroniza as respectivas
  notificações. O contador pode ser atualizado entre abas.
- O fluxo SSE do Ably renova o token antes de expirar, fecha a conexão anterior
  e mantém polling periódico caso o serviço esteja indisponível.
- O upload de foto possui limite de corpo multipart mesmo sem Content-Length,
  decodificação/normalização de imagem e limpeza do arquivo anterior.
- Web Push pode ser ativado ou removido por dispositivo no Perfil; inscrição
  fica associada a uma única conta de cada vez (índice único no endpoint).
  O usuário deve salvar as preferências após ativar ou desativar o dispositivo.
- O Service Worker permite abrir o chat ao clicar na notificação.

Para executar os novos testes, use `npm run verificar:revisao` no PR.
A entrega de Web Push com o navegador fechado exige chaves VAPID válidas e
um teste real em Preview. **O READY da Vercel e o SQL instalado não
substituem a homologação entre contas.**

## Complementos de 30/10 — navegação, preferências e alertas por conversa

- Cabeçalho: menu de conta com avatar, perfil, chat e saída, com Escape,
  clique fora e feedback de foco. O menu acompanha mudança de foto entre abas.
- Perfil dos colegas: abre diretamente uma conversa privada após verificar a
  sessão e a existência da conta; não abre um chat consigo próprio.
- Preferências pessoais: alterações salvas são refletidas imediatamente nas
  abas abertas, sem exibir avisos retroativos.
- Os alertas de uma conversa podem ser silenciados pelo botão de sino na
  lista de conversas. O estado é exclusivo do usuário que clicou e não
  impede mensagens, não apaga histórico e não bloqueia contadores do chat.
- Ao silenciar, a central e o Web Push deixam de notificar aquela conversa;
  ao reativar, os avisos disponíveis voltam a aparecer.
- Esta opção usa `db/011_chat_silenciar.sql`, aplicado somente no Neon
  Preview `dev-fase-7c1`. Esta migração é obrigatória antes de publicar
  a implementação na produção.

### VAPID no Preview

Foi criado um par de chaves P-256 específico do Preview, configurado na
Vercel apenas para a branch `feat/fase-8-repaginacao-comunicacao`, sob as
variáveis sensíveis `WEB_PUSH_PUBLIC_KEY` e `WEB_PUSH_PRIVATE_KEY`.
**Nenhuma chave foi adicionada ao repositório ou à Production.**
Configuração não equivale a garantia de entrega: testar a permissão,
assinatura, recebimento com a aba fechada e clique para abrir o chat.

### Critérios de aceite restantes

1. Logar com duas contas independentes no Preview e testar mensagens
   privadas/gerais e os efeitos do silenciamento em cada conta.
2. Verificar a central de notificações, o badge no título e as notificações
   nativas ao trocar de aba e reabrir o navegador.
3. Testar fotos de perfil e permissões de leitura com usuários diferentes.
4. Testar em smartphone e desktop, com movimento reduzido.
5. Confirmar que Preview usa o banco de Preview antes de inserir
   dados reais de teste.

Não aplicar migrações 010/011 nem ativar novas variáveis na produção nesta fase.

## Auditoria de estabilidade — 31/10/2026

Melhorias realizadas sem novas migrações:

- Chat: confirmação de leitura limitada pelo ID máximo efetivamente devolvido ao
  navegador. Evita que mensagens recebidas após a consulta sejam marcadas como lidas.
- Mensagens: proteção contra dois envios simultâneos e contra respostas de
  carregamentos antigos substituírem mensagens novas.
- Histórico: comparação semântica e deduplicação na paginação para evitar
  renderizações e reposicionamentos de rolagem quando nada mudou.
- Entregas externas: Ably e Web Push passam a ser solicitados com `after()`
  depois da resposta do endpoint; o envio não fica bloqueado por tempo de
  resposta desses serviços e não se converte em falha após gravar no banco.
- Presença: o componente global não envia pings redundantes quando o
  ChatPainel já está encarregado da presença na rota `/chat`.
- Central: respostas HTTP fora de ordem são ignoradas; erros temporários
  exibem aviso de sincronização e preservam o último estado útil.
- Sessão expirada: a central, o chat e o perfil redirecionam ao login quando
  recebem HTTP 401, sem continuar exibindo o histórico como se fosse atual.
- Web Push: inscrição já existente é reutilizada quando tem chave
  compatível; permissionamento de notificações ocorre diretamente no clique.
- Logout: tenta remover e cancelar a assinatura do dispositivo atual antes
  de encerrar a sessão, sem afetar inscrições de outros aparelhos.
- Perfil: restringe uploads de foto simultâneos, apresenta fallback quando
  a foto não pode ser exibida e permite repetir a consulta após falha temporária.
- Avatar: upload limita duração de rede e exclusão de versão antiga usa
  processamento após a resposta para evitar atrasar o usuário.

Regressões automatizadas adicionais: leitura em corrida com novas mensagens,
IDs de notificações, deduplicação de histórico, paginação, alterações de
respostas, confirmação de limite e envio externo não bloqueante.

### Limitações de validação

As verificações automatizadas, o status `READY` e a inspeção do Neon
não equivalem à homologação autenticada com múltiplos dispositivos.
Também não foi possível consultar os logs de execução da Vercel nesta
rodada: a API conectada retornou 403. A observabilidade precisa ser
validada diretamente no painel ou ter suas permissões ajustadas.

**Nenhuma alteração em main ou Neon Production foi autorizada ou aplicada.**
