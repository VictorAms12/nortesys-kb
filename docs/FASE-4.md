# Fase 4 — Busca global

## O que mudou

A base Nortesys KB agora tem uma página de pesquisa em `/busca` e um campo no cabeçalho em todas as páginas. O índice é gerado a partir dos arquivos Markdown existentes, sem banco de dados. O componente de busca roda no navegador usando **Fuse.js**, com termos e códigos de erro, tolerância a erros de digitação, ignorando diferenças de maiúsculas/minúsculas e acentos.

### Recursos

1. Consulta instantânea pelo título, resumo, tags, sistema, códigos de erro e texto completo das **sete seções**.
2. Ranking de relevância: código de erro exato antes dos demais resultados; depois código parcial, título e pontuação fuzzy.
3. Filtros combináveis por **categoria, sistema, nível N1/N2/N3 e status**.
4. Destaque dos termos e trecho do texto da solução, tudo renderizado como texto seguro (sem HTML injetado).
5. Mensagens para pesquisa vazia, nenhum resultado e filtros sem correspondência.
6. Formulário no cabeçalho e atalho **Ctrl+K** (Windows/Linux) ou **Cmd+K** (macOS). **Esc** sai do campo.
7. Links com consulta na URL, por exemplo `/busca?q=CLI-DUP-001` (pressione Enter na busca principal).
8. Responsividade e suporte ao tema claro/escuro existentes.

## Atualização da Fase 3 para a Fase 4

Pare o projeto com `Ctrl+C`. Faça uma cópia da pasta atual. Extraia **Nortesys-KB-Fase-4-Atualizacao.zip** na **raiz do projeto Fase 3**, na pasta em que fica `package.json`, permitindo a substituição dos arquivos. Não exclua a pasta `content/`: seus artigos serão mantidos.

No terminal do VS Code (PowerShell):

```powershell
npm.cmd install
npm.cmd run verificar:estrutura
npm.cmd run validar:artigos
npm.cmd run testar:validacao
npm.cmd run testar:busca
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

A biblioteca adicional é `fuse.js` (`^7.4.0`); não há novo serviço ou configuração de credencial.

Para instalação limpa, use **Nortesys-KB-Fase-4-Completo.zip** e rode os mesmos comandos na pasta `nortesys-kb-fase4`.

## Testes manuais de aceite

1. Na página inicial, clique em **Pesquisar procedimentos** e abra `/busca`.
2. Digite `CLI-DUP-001`: o artigo fictício de cliente duplicado deve aparecer em primeiro lugar.
3. Experimente `cliente`, `duplicidade`, `operador`, `cadastro duplicado` e `permissão` para conferir a busca no corpo do artigo.
4. Use a categoria **Cadastros**: o artigo permanece; selecione **Notas Fiscais**: nenhum resultado nesse exemplo, com mensagem adequada.
5. No cabeçalho, pressione **Ctrl+K**, digite `CLI-DUP-001` e pressione Enter. A URL deve incluir `?q=CLI-DUP-001`.
6. Na página `/busca`, digite o termo e pressione Enter. Copie o link, abra em outra aba; a mesma consulta deve aparecer.
7. Teste uma consulta sem correspondência (ex.: `xyzzyzz-987`) e depois clique em **Limpar filtros**, se houver filtros ativos.
8. Teste uma tela pequena, modo escuro e um artigo aberto a partir dos resultados.
9. Execute os comandos `testar:busca`, `lint` e `build` sem erros antes de avançar.

## Observações técnicas

- O `Fuse.js` usa `ignoreLocation: true` para não ignorar ocorrências no meio/final de textos longos; `useTokenSearch` pesquisa por palavras mesmo em consultas com vários termos.
- A página é pré-renderizada e passa um índice de conteúdo ao componente cliente, atualizando quando o projeto for reconstruído. Se adicionar um Markdown, execute novo build ou atualize o ambiente de desenvolvimento.
- A pesquisa dos conteúdos de todos os artigos **é local ao navegador**, não exige serviço remoto, mas também significa que o índice pode ser inspecionado por qualquer visitante com acesso à página.
- **Importante:** até a Fase 5, o projeto não controla acesso. Não hospede o site com artigos internos, prints, credenciais ou dados pessoais reais. `robots: noindex` não é uma proteção de acesso.
- Os textos dos resultados são renderizados sem interpretar HTML recebido dos Markdown; isso não substitui a proteção de acesso.

## Limitações nesta fase

- Não existe login, controle por permissões, histórico de pesquisa, sugestões baseadas em chamados reais ou analytics.
- O índice completo vai para o navegador: é apropriado para uma base pequena/média, mas bases grandes podem exigir busca no servidor, com controles de acesso, no futuro.
- A ordenação de resultados é aproximada (Fuse.js); não é garantia de classificação semântica por IA.

**Após validar a Fase 4, aguarde a Fase 5.**
