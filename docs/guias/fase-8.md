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
