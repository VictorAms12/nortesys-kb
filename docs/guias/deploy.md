# Publicação na Vercel

## Preparar os ambientes

No projeto Vercel, confira `DATABASE_URL` e a conexão do Blob privado em cada ambiente utilizado:

| Ambiente | Destino esperado |
| --- | --- |
| Development | Banco e armazenamento destinados ao desenvolvimento |
| Preview | Banco e armazenamento destinados à validação da branch |
| Production | Banco e armazenamento da aplicação publicada |

Uma configuração limitada a uma branch de Preview não se aplica a outra branch nem à produção. Se houver uma variável geral e uma configuração específica de branch, confira qual valor foi escolhido para o deployment em questão. O nome `neondb` sozinho não identifica a branch Neon; compare também o projeto e endpoint no painel, sem compartilhar credenciais.

Mudanças de variáveis precisam estar presentes em um novo deployment. Ao fazer redeploy, confira **o código/commit selecionado e o ambiente de destino**. Redeploy de uma versão antiga não incorpora código de outra branch.

## Banco e build

Antes de publicar funcionalidades que dependem do banco, aplique as migrações necessárias no destino correspondente. As instruções completas estão no [guia de configuração](configuracao.md).

- Migrações 001–003: CLI `db:migrar` ou aplicação manual revisada.
- Migração 004: aplicação manual do arquivo inteiro, incluindo a transação.
- Migração 005: anexos PDF privados (Neon), aplicação manual antes da fase 7C.2.
- Migração 006: chat e presença, aplicação manual antes da fase 7G (Preview e depois Production).
- Chat: configurar `ABLY_API_KEY` por ambiente; não expor a chave ao navegador.
- O build não aplica SQL e não cria contas.

O build normal é `npm run build`. A revisão local usa `npm run verificar:revisao` e `npm run build:revisao`, sem as credenciais reais. Não envie `.env.local`, `.vercel/`, `.local/`, `node_modules/` ou snapshots de `build/` ao Git.

## Validar a publicação

Confira o commit e o ambiente no deployment. Depois:

1. Entre com os perfis que serão usados e confira os menus permitidos.
2. Pesquise e aplique filtros; navegue entre biblioteca, favoritos e recentes.
3. Como editor, salve um artigo de teste, confira a versão e envie uma imagem.
4. Recarregue o artigo e abra a imagem. Confira as restrições de rascunhos para leitores.
5. Teste navegação móvel, teclado, preferência por movimento reduzido e retorno pelo histórico.

Os testes HTTP isolados verificam carregamento e bloqueios sem sessão. Eles não comprovam as permissões da integração Blob, a conexão real com o banco nem o resultado visual em todos os dispositivos.

## Diagnóstico

| Sintoma | Conferência inicial |
| --- | --- |
| Login mostra “Acesso indisponível” | `DATABASE_URL` no deployment ativo, escopo da variável e banco configurado |
| Upload retorna 503 em `banco_cota` / `IMAGEM_BANCO_MIGRACAO_INCOMPATIVEL` | Migração 004 e estrutura de `kb_imagem_limites` no banco efetivamente usado |
| Upload falha na etapa de armazenamento | Store privado conectado e autenticação Blob válida naquele ambiente |
| Preview funciona e produção falha | Configurações, migrações e commit dos dois deployments |
| Imagem aparece na prévia mas artigo não salva | Estado do upload, autoria e vínculo exclusivo com o artigo |

Use o código/etapa do log para localizar a falha. Não publique connection strings, cookies de sessão ou tokens. Objetos de upload com estado pendente/falhou exigem análise antes de limpeza; imagens associadas também podem fazer parte do histórico. Não há rotina automática de exclusão de imagens órfãs nesta versão.
