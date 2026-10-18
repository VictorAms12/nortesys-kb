> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Fase 7C.1 — Upload definitivo de imagens

## Implementação

Arquivos desta fase:

| Arquivos | Responsabilidade |
| --- | --- |
| `src/app/api/admin/imagens/route.ts`, `src/app/api/imagens/[id]/route.ts` | Rotas de upload e leitura autenticada |
| `src/lib/imagens.ts` | Contrato compartilhado, descrição e inserção Markdown |
| `src/lib/imagens-validacao.ts` | Decodificação e normalização binária |
| `src/lib/imagens-servico.ts` | Autorização, limite do corpo, coordenação e compensação |
| `src/lib/imagens-repositorio.ts`, `src/lib/imagens-sql.ts` | Metadados e cota atômica |
| `src/lib/imagens-blob.ts`, `src/lib/imagens-servidor.ts` | Adaptador Blob privado e composição server-only |
| `src/components/editor-markdown.tsx`, `src/components/conteudo-markdown.tsx` | Envio definitivo, descrição, inserção e caminhos permitidos |
| `src/app/api/admin/artigos/route.ts`, `src/components/alerta-admin.tsx` | Aviso de associação inválida, preservando o salvamento e as versões existentes |
| `db/004_imagens.sql` | Migração manual de metadados, cota e associação transacional |
| `tests/testar-imagens.ts`, `scripts/testar-upload-imagens-local.ts` | Suíte nova e adaptação do teste legado ao editor atual |
| `package.json`, `package-lock.json` | Script `testar:imagens`, sharp direto e PGlite para testes; Blob já instalado foi preservado |
| `docs/historico/FASE-7C1-UPLOAD-DEFINITIVO.md`, `docs/historico/TESTE-UPLOAD-IMAGENS-LOCAL.md` | Relatório, instruções atuais e indicação do guia histórico |

`imagem-ampliavel.tsx`, `imagens-local.ts`, a rota local, a autenticação e `artigos-banco.ts` foram analisados e preservados nesta fase. As alterações pendentes anteriores continuam na branch.

O botão **Enviar print** usa `POST /api/admin/imagens` no desenvolvimento, Preview e produção. O servidor autentica a sessão existente, exige administrador/editor, verifica origem e limita cada usuário a 20 tentativas de envio por janela de uma hora. A cota é reservada atomicamente no PostgreSQL, compartilhada pelas instâncias da Vercel. Tentativas multipart inválidas também consomem cota; não há contador em memória nem fallback local.

O corpo da requisição é limitado durante a leitura, mesmo sem `Content-Length`. Cada arquivo tem até 2 MiB. PNG, JPEG e WebP precisam ter MIME e assinatura compatíveis e passar pela decodificação completa com `sharp`. Arquivos corrompidos, animações, SVG, HTML e imagens com mais de 20 milhões de pixels são rejeitados. A imagem é recodificada, sem EXIF/dados extras, e o tamanho normalizado também é limitado a 2 MiB.

Um UUID aleatório identifica o objeto `kb-imagens/UUID.ext`. O SDK grava com `access: private`, sem sobrescrita. O navegador recebe apenas identificador, descrição alternativa e `/api/imagens/UUID`, nunca o endereço do Blob ou credenciais.

## Autenticação do armazenamento

O `@vercel/blob` instalado suporta a resolução automática da integração:

- OIDC: `BLOB_STORE_ID` e identidade OIDC fornecida pela Vercel. O SDK usa e renova a identidade conforme a integração; o aplicativo não extrai nem encaminha o token ao navegador.
- Integrações com token estático: `BLOB_READ_WRITE_TOKEN`, resolvido pelo SDK quando OIDC não é utilizado.

Não configure essas credenciais como variáveis `NEXT_PUBLIC_*`. Não é necessário inserir um token no código. Se houver OIDC e store configurados, a preferência de autenticação é a do próprio SDK.

Referências: [autenticação do SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk#authentication) e [armazenamento privado](https://vercel.com/docs/vercel-blob/private-storage).

Nenhum acesso real ao Neon ou Blob foi executado nesta implementação. As configurações locais não foram lidas. Antes de um teste real, confirme no painel que Development/Preview apontam para **dev-fase-7c1** e para o store **privado** desejado. Se esses destinos não estiverem claros, interrompa o teste real até confirmar; não use o banco de produção para homologação.

## Migração manual

Arquivo: `db/004_imagens.sql`. Requer as migrações 001, 002 e 003 já existentes.

1. Selecione explicitamente a branch **dev-fase-7c1** no SQL Editor do Neon.
2. Confira o banco selecionado.
3. Revise e execute **o arquivo completo**, incluindo `BEGIN` e `COMMIT`.

A migração cria:

- `kb_imagens`: id, caminho privado, MIME, tamanho, dimensões, descrição, usuário, data, artigo e estado do upload.
- `kb_imagem_limites`: contador por usuário e início da janela de uma hora.
- Índices, constraints e a função/trigger `kb_associar_imagens_artigo`.

Nenhum artigo é atualizado ou excluído pela migração. O vínculo é feito apenas quando um artigo é inserido/editado com referências privadas. O trigger associa as imagens na mesma transação da gravação e do histórico existentes. Só o autor pode associar seu upload ainda sem artigo; uma imagem já associada não pode ser transferida para outro artigo. Para reutilizar em outro artigo, envie uma nova cópia. Referências inexistentes, uploads incompletos ou de terceiros impedem a gravação inteira e exibem um aviso no formulário.

**Não use `npm run db:migrar` para aplicar o arquivo 004.** O runner legado usa um separador de instruções incompatível com funções PL/pgSQL e foi preservado sem incluir esta migração. Nenhuma migração é executada no build ou automaticamente pelo upload. Antes da aplicação manual, os endpoints de imagens retornam indisponibilidade; artigos antigos continuam funcionando.

## Leitura e histórico

`GET /api/imagens/[id]` autentica a sessão e verifica o vínculo antes de buscar o Blob:

| Situação | Acesso |
| --- | --- |
| Upload pronto, ainda sem artigo | Somente seu autor, se ainda for administrador/editor |
| Artigo em rascunho | Administradores e editores |
| Artigo revisado/obsoleto, não arquivado, imagem ainda referenciada | Todos os usuários autenticados |
| Imagem removida do texto ou artigo arquivado | Somente administradores/editores, para preservar histórico |
| Upload pendente, falhou ou aguardando limpeza | Ninguém |
| Sem sessão | Negado |

Essas regras seguem o modelo atual de acesso global por perfil; não há ACL individual adicional no projeto. A cada GET, status, arquivamento e referência atual são consultados novamente. Respostas têm `private, no-store`, `Vary: Cookie` e `nosniff`; cabeçalhos/URLs privilegiados do Blob não são repassados. A imagem é transmitida pelo servidor, sem redirecionar o usuário para o store.

Imagens estáticas antigas e referências do protótipo em `/imagens/...` continuam renderizando pelo fluxo legado. Elas não são copiadas, removidas ou convertidas automaticamente em imagens privadas com vínculo por artigo. Arquivos em `uploads-locais` continuam apenas no computador em que foram criados. A rota antiga de upload permanece restrita a localhost/desenvolvimento e não é usada pelo botão do editor.

## Renderização e editor

Foram preservados `unoptimized`, URL direta com cookie, tratamento compacto de falhas e o modal em portal. Não há `figure` dentro de parágrafo/ênfase nem botão aninhado em link. O diálogo só monta ao ampliar e continua aceitando Escape e clique no fundo.

A descrição alternativa pode ser preenchida antes do envio; em branco, usa o nome do arquivo sanitizado. O print substitui a seleção na posição do cursor. Um indicador indeterminado acompanha o envio; não representa uma porcentagem de bytes. O conteúdo e a submissão ficam bloqueados enquanto o envio está em andamento. O limite de 60.000 caracteres é validado antes do upload, sem truncar a URL. Prévia, rascunho em sessionStorage e serialização do artigo preservam a referência privada.

## Falhas parciais e reconciliação

Antes do PUT, existe um registro `pendente` com o caminho planejado. Se o registro falhar, o Blob não é enviado. Se o PUT ou a confirmação no banco falhar, o servidor tenta excluir somente o objeto desse upload e registra `falhou`. Se a exclusão falhar, registra `limpeza_pendente`. Se o banco também estiver indisponível, o registro reservado continua rastreável. Nenhum desses estados libera leitura.

Uma interrupção abrupta do processo pode deixar registros pendentes; o Blob e PostgreSQL não compartilham uma transação distribuída. Não há exclusão automática nem tarefa agendada nesta fase. Para revisão manual, no banco de desenvolvimento confirmado:

```sql
SELECT id, blob_caminho, estado, enviado_em, artigo_id
FROM kb_imagens
WHERE artigo_id IS NULL
  AND (estado <> 'pronta' OR enviado_em < NOW() - INTERVAL '7 days')
ORDER BY enviado_em;
```

Uploads prontos sem artigo incluem rascunhos ainda não salvos; não os exclua automaticamente. Antes de limpar um registro antigo, confirme que não há upload em andamento e confira o objeto no store correspondente. Preserve imagens associadas para manter versões históricas. A limpeza real exige uma operação administrativa separada, com destino confirmado.

## Testes locais sem serviços externos

```powershell
npm.cmd run testar:imagens
npx.cmd --no-install tsx scripts/testar-upload-imagens-local.ts
npx.cmd --no-install tsx tests/testar-hidratacao-imagens.ts
npm.cmd run lint
```

`testar:imagens` executa PostgreSQL/PGlite somente em memória, aplica o SQL real nesse ambiente efêmero e utiliza o mesmo repositório e serviço das rotas, com o SDK Blob simulado. Não carrega `.env`, não conecta ao Neon e não grava no store real. Verifica perfis, origem, MIME/decodificação, leitura privada, rascunhos, publicação/despublicação, histórico, associação, rollback, persistência entre requisições, limites, compensação e renderização.

Os testes de HTML usam renderização estática; não equivalem a uma sessão de navegador com hidratação real. Uploads reais, permissões OIDC da conta e latência do store exigem a validação manual abaixo.

O build de verificação pode ser feito em uma cópia de trabalho sem arquivos `.env`, removendo as variáveis de banco/storage apenas do processo de teste. Nesta execução foi usada `build/verificacao-fase-7c1/`, ignorada pelo Git, para que o Next não carregasse credenciais. O `npm run build` normal do Next carrega os arquivos `.env` do diretório em que é executado.

## Homologação no localhost e Vercel Preview

Execute estes passos somente depois de confirmar Development/Preview no Neon **dev-fase-7c1**, aplicar manualmente o SQL e conferir a conexão do store privado.

1. No localhost, use `npm.cmd run dev`. No painel da Vercel, confirme que a integração Blob está conectada também ao ambiente Development. Se usar OIDC local, atualize as credenciais pelo fluxo oficial da Vercel quando expirarem, sem compartilhá-las no chat ou em logs.
2. Entre como editor; em um artigo de teste, descreva e envie uma captura PNG/JPEG/WebP de até 2 MB. Confira a referência `/api/imagens/UUID` em **Editar**, a prévia e a ampliação.
3. Salve como rascunho e recarregue: a imagem deve permanecer. Confira metadados no banco de desenvolvimento e o objeto privado no painel Blob. A leitura direta do objeto sem credenciais deve ser negada.
4. Em outro navegador, como leitor, tente a rota da imagem: deve receber acesso negado. Após publicar o artigo de teste como revisado, a mesma imagem deve ficar visível ao leitor autenticado.
5. Volte a rascunho ou arquive o artigo; recarregue a imagem no navegador do leitor. O acesso deve ser revogado. Remover a imagem do texto deve preservar os bytes/metadados para o histórico editorial.
6. Confirme que o leitor não consegue chamar o POST e que sem sessão não há leitura. Teste arquivo SVG, arquivo renomeado para PNG e arquivo maior que 2 MB.
7. Na Preview, configure o mesmo banco de desenvolvimento e o store privado pretendido, com OIDC ou a integração de token suportada. Quando você criar a Preview pelo seu fluxo habitual, repita os passos 2–6 e confirme o upload depois de um reinício/redeploy da Preview: o arquivo não depende do disco da função.

Nenhum deploy, commit, push, merge ou aplicação de migração faz parte da implementação local. Produção exige posteriormente aplicar a migração no destino correto e validar as configurações específicas de produção em uma operação autorizada separada.
