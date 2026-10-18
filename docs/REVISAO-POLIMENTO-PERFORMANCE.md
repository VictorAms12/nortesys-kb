# Revisão e polimento — 18/10/2026

Branch: `revisao-polimento-performance`, baseada na versão de upload integrada à `main`.

## Escopo e resultados

Revisão de carregamento de artigos, autenticação compartilhada entre layouts e páginas, busca, favoritos/recentes, navegação, tratamento de falhas e ferramentas de build. As suítes existentes também verificam formulários, validação de conteúdo, permissões, sessões, origem das requisições, upload e associação de imagens.

| Problema encontrado | Alteração |
| --- | --- |
| Layout, página e metadados consultavam a sessão separadamente | `sessaoAtual` compartilha a consulta somente durante a mesma renderização no servidor |
| Página de artigo e metadados carregavam e validavam a biblioteca novamente | `carregarTodosArtigos` compartilha o resultado por papel e por requisição |
| Uma cópia Markdown podia reaparecer quando seu registro no banco era arquivado ou ocultado | O banco tem precedência também para ocultação; leitores não recebem rascunhos locais |
| Favoritos e recentes esperavam duas leituras independentes em sequência | Consultas iniciadas em paralelo |
| Cada tecla da busca reconstruía a lista inteira na renderização urgente | Consulta adiada, lista memoizada e primeiros 30 resultados com botão para carregar mais |
| Storage bloqueado podia quebrar tema e navegação | Preferências temporárias por aba quando localStorage não está disponível |
| Menu móvel permitia navegar por teclado e rolar o conteúdo de fundo | Contenção de foco, restauração de foco, fundo inerte e fechamento ao retornar ao desktop |
| Falhas de página não tinham recuperação própria | Tela com tentativa novamente e retorno ao início; estado de carregamento |
| TypeScript incluía cópias antigas dentro de build/ | Exclusão de build/ e out/ da checagem; raiz de rastreamento explícita no Next |

O cache de renderização não persiste sessões nem artigos entre requisições. As permissões continuam sendo consultadas no banco nos acessos seguintes. Referências: [React cache](https://react.dev/reference/react/cache) e [useDeferredValue](https://react.dev/reference/react/useDeferredValue).

## Validação

- Testes existentes: conteúdo, busca, segurança, usuários, formulários, estrutura, login e HTML de imagens.
- 16 testes na execução conjunta de imagens e regressões da revisão, com PostgreSQL/PGlite em memória e Blob simulado.
- Lint e TypeScript sem erros após os ajustes.
- Build de produção com Webpack aprovado, em cópia sem arquivos `.env`, credenciais ou uploads locais.
- Teste HTTP do build: login 200, CSS 200, cabeçalhos de proteção e respostas 401 para leitura/upload de imagens sem sessão.

Comandos reproduzíveis:

```powershell
npm.cmd run verificar:revisao
npm.cmd run build:revisao
node scripts/testar-build-revisao.mjs build/revisao-IDENTIFICADOR
```

O comando de build imprime o diretório gerado. Cada execução cria uma nova cópia em `build/`, ignorada pelo Git, usando as dependências já instaladas. Não carrega a configuração local do banco nem aplica migrações.

## Limites e próxima validação

Não houve medição de latência na Vercel, Lighthouse ou teste visual autenticado: não havia navegador conectado. As melhorias de consultas e renderização são verificáveis no código, mas não representam uma porcentagem medida de ganho em produção.

Antes de integrar, validar no Preview: login com os três perfis, biblioteca sem rascunhos para leitores, busca com filtros e mais de 30 resultados, menu móvel com Tab/Escape, favoritos, edição, upload e leitura após salvar. A variável específica da antiga branch de upload não se aplica automaticamente a esta nova branch; confirmar o banco de desenvolvimento do Preview antes de publicar.

Esta entrega não requer migração de banco. Produção, variáveis de ambiente e os arquivos locais pendentes anteriores não foram alterados.

Para crescimento futuro: paginação administrativa no servidor e carregamento individual de artigos. A biblioteca completa ainda é carregada para a busca; não foi substituída por pesquisa remota nesta revisão.
