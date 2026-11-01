# Backup, restauração e resposta a incidentes — Nortesys KB

## Inventário de recuperação

| Ativo | Conteúdo | Método recomendado | Frequência |
| --- | --- | --- | --- |
| Neon PostgreSQL (`nortesyskb`) | usuários, sessões, artigos, revisões, chat, anexos/links, auditoria, migrações | recuperação point-in-time quando incluída no plano, export lógico `pg_dump` criptografado e verificação de restauração | diário e antes de migrações |
| Vercel Blob (store PRIVADO) | bytes de imagens e PDFs, que **não** são guardados no banco | inventário de objetos e cópia criptografada de objetos privados para armazenamento de backup com versionamento independente | diário/antes de excluir objetos |
| Variáveis de ambiente | integração Neon, Blob, Ably, Push, cron | cópia controlada em gerenciador de segredos separado; **nunca** salvar valores no Git, artefatos CI ou logs | em cada alteração de configuração |
| Código e SQL | tags/releases, migrações, arquivos versionados | repositório Git e espelho controlado | a cada merge |

Retenção de backups recomendada: 7 cópias diárias, 4 semanais e 3 mensais, ajustando custos, LGPD e contratos. Os dados de chat e imagens privadas exigem acesso limitado, criptografia em repouso e em trânsito, trilha de quem acessa e descarte programado. Usar cópia fora da conta Neon/Vercel para evitar ponto único de falha. **Neon branching não substitui backup externo**, e Point-in-Time Recovery depende da janela disponível no plano.

## Procedimento de cópia

1. Conferir projeto, branch exata e endpoint (não basta a database chamar `neondb`); inventariar schema e migrações com `npm run db:status` em conexão somente leitura.
2. Registrar instante de corte, volume, IDs e checksums de arquivos num manifesto **sem conteúdo sensível**.
3. Criar dump PostgreSQL com transação consistente; transportar por canal criptografado para armazenamento de backup isolado. Não anexar dumps ao GitHub, chats ou tickets.
4. Inventariar e copiar todos os objetos privados do Blob preservando caminhos, tipos e hashes. Metadados/URLs do Neon **não** contêm os bytes; restore de banco sozinho deixa imagens e PDFs quebrados.
5. Registrar apenas nomes das variáveis e conferir presença no gerenciador de segredos; os valores não entram no manifesto.
6. Validar cópia por tamanho, checksum, lista de objetos e leitura de amostra aleatória; limitar acesso e registrar verificação.

## Restauração controlada (ensaio obrigatório)

1. Declarar incidente, suspender operações de escrita somente se for necessário e registrar ponto de recuperação. Guardar snapshot anterior de forma segura.
2. Criar projeto/branch Neon **isolado** para recuperação; nunca restaurar sobre `production` sem autorização adicional. Restaurar dump ou executar recuperação de momento, se disponível.
3. Verificar `kb_migracoes`, `kb_usuarios`, `kb_artigos`, `kb_chat_mensagens`, integridade referencial e diferenças entre esquema e código. Não reaplicar SQL 001–017 sem inventário.
4. Recuperar arquivos em store Blob **separado**, conferindo caminhos, hashes e permissões de acesso. Corrigir mapeamentos somente no ambiente de ensaio.
5. Preparar deployment de Preview com `DATABASE_URL` e Blob isolados; recriar secrets com valores gerenciados, sem reutilizar segredos comprometidos.
6. Rodar lint, typecheck, testes, login com perfis de teste, pesquisa, chat (incluindo mensagens com imagem), anexos, feedback e cron em modo controlado; testar dark/light e dispositivos reais.
7. Medir tempo de recuperação (RTO) e perda de dados (RPO). Metas sugeridas para aprovar com o time: RTO 4h e RPO 24h; não há garantia de atendimento sem ensaio e monitoramento.
8. Documentar resultado, falhas, responsáveis e ações; só promover para produção após revisão e janela de mudança.

## Variáveis de ambiente por nome (nunca por valor)

**Obrigatória de aplicação:** `DATABASE_URL`. **Upload privado:** `BLOB_STORE_ID` quando OIDC, ou `BLOB_READ_WRITE_TOKEN` quando autenticação por token. **Chat realtime:** `ABLY_API_KEY`. **Cron:** `CRON_SECRET`. **Web Push:** `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`. **Retenções:** `NOTIFICACOES_RETENCAO_DIAS`, `AUDITORIA_RETENCAO_DIAS`. Não usar `NEXT_PUBLIC_` em segredos.

## Rotação de segredos

- **DATABASE_URL**: criar role/credencial nova com escopo mínimo no Neon, testar conexão em Preview, atualizar Vercel Production e Preview, publicar novo deployment e revogar a credencial antiga após confirmar conexões. Se houve vazamento, revogar com prioridade; sessões podem exigir revogação conforme o alcance.
- **CRON_SECRET**: criar novo segredo aleatório (mínimo 24 caracteres), atualizar o ambiente de destino, redeploy, testar 401 sem Bearer e execução autenticada pelo cron, descartar valor antigo. Não acionar manualmente o cron em produção durante ensaio.
- **ABLY_API_KEY**: criar nova chave com escopo mínimo `kb-chat:*`, testar realtime no Preview, atualizar ambiente e invalidar chave antiga no painel Ably. Não registrar payloads de mensagens.
- **WEB_PUSH_PRIVATE_KEY / WEB_PUSH_PUBLIC_KEY**: gerar novo par VAPID e reconfigurar subject. Notificações Push existentes podem precisar de novas inscrições, informar usuários; não expor chave privada.
- **BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID**: rotacionar/revogar token estático ou credencial OIDC, revisar permissões privadas, testar upload/leitura sob autenticação e verificar que anexos continuam vinculados. O ID sozinho não é credencial.

## Resposta a vazamento

1. Restringir acessos e cessar exposição, preservando evidências sem copiar segredos para logs ou tickets.
2. Identificar natureza, janela e contas afetadas; revogar/rotacionar imediatamente secrets comprometidos e sessões impactadas.
3. Verificar logs de acesso/auditoria em consoles de fornecedores, operações no Neon, armazenamento Blob, Ably, GitHub e Vercel; manter evidências segregadas.
4. Revisar permissões, histórico Git, deploys e artefatos CI. Remover valores de locais acessíveis e considerar histórico já distribuído como comprometido, mesmo que posteriormente reescrito.
5. Avaliar comunicação interna e obrigações legais (inclusive LGPD) com o responsável pelo tratamento de dados; registrar cronologia e ações de prevenção.

## Limites desta documentação

É um roteiro. **Não** foi realizado backup, cópia de segredo, restauração real, verificação de plano PITR, recuperação de Blob ou rotação em produção. Exige validação operacional com os provedores antes de ser tratado como plano homologado.
