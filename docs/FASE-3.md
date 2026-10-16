# Fase 3 — Interface e leitura de artigos

## O que foi entregue

- Página inicial com cartões para as sete categorias, artigos novos, atualizações e revisões vencidas.
- Página `/categorias/<categoria>` com filtros locais por tag, sistema, nível e status.
- Página `/artigos/<categoria>/<slug>` para cada Markdown; são geradas estaticamente durante o build.
- Artigos com sete seções em ordem, sumário lateral, revisão/status, ações de copiar passos, copiar link e imprimir.
- Renderização Markdown: títulos internos, listas, tabelas, links, blocos de código com cópia, imagens e destaques `:::aviso`, `:::dica` e `:::atencao`.
- Tema automático conforme o sistema, com alternância para claro e escuro.
- Página 404 com indicação das categorias (busca real chega na Fase 4).

## 1. Instalação sobre a Fase 2

Pare o servidor com `Ctrl+C`. Faça uma cópia da sua pasta e extraia o **ZIP de atualização da Fase 3** dentro do diretório onde fica o `package.json`, permitindo substituir arquivos.

No PowerShell, dentro da pasta:

```powershell
npm.cmd install
npm.cmd run validar:artigos
npm.cmd run testar:validacao
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

`npm.cmd install` adiciona apenas três bibliotecas (listadas abaixo). `validar:artigos` verifica o frontmatter com Zod e a ordem das seções. `testar:validacao` simula erros sem alterar seus dados. `lint` inspeciona o código e `build` gera as páginas para produção. `dev` liga o servidor local em `http://localhost:3000`.

## 2. Novas dependências (uma linha cada)

- `react-markdown`: transforma Markdown validado em componentes React, sem interpretar HTML arbitrário do artigo.
- `remark-gfm`: permite tabelas e caixas de tarefa no estilo GitHub Markdown.
- `remark-directive`: reconhece a sintaxe dos blocos `:::aviso`, `:::dica` e `:::atencao`.

Não há banco de dados, API externa, serviço pago ou dependência de autenticação nesta fase.

## 3. Rotas que você pode abrir

- `http://localhost:3000/`
- `http://localhost:3000/categorias/cadastros`
- `http://localhost:3000/artigos/cadastros/cliente-duplicado`
- `http://localhost:3000/um-endereco-inexistente` (404)

Na página do artigo, clique em **Copiar passos**, **Copiar link** ou **Imprimir**. No celular, o conteúdo se adapta à largura da tela. A busca por palavra/código entra na Fase 4 — não existe uma busca falsa nesta etapa.

## 4. Usando blocos especiais no Markdown

Escreva dentro de qualquer uma das sete seções obrigatórias:

```markdown
:::aviso
Esta informação precisa ser conferida no ambiente do cliente.
:::

:::dica
Confira primeiro a versão do ERP.
:::

:::atencao
Nunca compartilhe dados pessoais ou credenciais reais.
:::
```

Para inserir um comando com botão **Copiar**:

````markdown
```text
ERRO-FICTICIO-100: Mensagem de teste.
```
````

Para inserir imagem com legenda:

```markdown
![Tela fictícia de configuração](/imagens/tela-exemplo.webp "Aba de configuração")
```

Coloque a imagem em `public/imagens/tela-exemplo.webp`. Use **WebP**, dimensão e peso pequenos (idealmente abaixo de 200 KB), e texto `alt` explicando o que a imagem mostra. A página usa `next/image` e faz carregamento sob demanda. Clique sobre a imagem para ampliar; pressione `Esc` para fechar. **Nunca suba prints reais contendo dados de clientes.**

## 5. Estados, datas e publicação estática

- `status: rascunho` mostra alerta de conteúdo não revisado.
- `status: obsoleto` mostra alerta que orienta a não aplicar sem revisão técnica.
- `revisarAte` anterior à data do build mostra aviso de revisão vencida.
- A lista de pendências é calculada no momento do build, portanto **não muda sozinha à meia-noite**. É atualizada no próximo deploy/build. Se necessário, criaremos uma rotina de rebuild na Fase 7.
- **Ainda não há senha**: não envie a base para hospedagem pública antes da Fase 5.

## 6. Testes de aceite

1. A home mostra sete categorias, um artigo recente e o quadro de atualizações.
2. Abra `Cadastros`; o artigo fictício é listado.
3. Mude os filtros; a lista atualiza sem recarregar o site.
4. Abra o artigo e confira os sete títulos e o sumário lateral.
5. Copie os passos e cole num bloco de notas: devem aparecer numerados.
6. Clique no botão de código e teste a impressão.
7. Alterne entre sistema, claro e escuro; atualize a página e confira se a preferência manual permaneceu.
8. Teste pelo modo de dispositivos móveis do navegador (F12).
9. Rode `npm.cmd run build`; as páginas de categorias e artigo devem ser pré-renderizadas.

## 7. Erros comuns e soluções

- **`Cannot find module 'react-markdown'`**: execute `npm.cmd install` no diretório certo.
- **`Module not found: remark-directive`**: execute `npm.cmd install` novamente e verifique sua conexão.
- **`404` em artigo**: confirme a pasta `content/<categoria>/<slug>.md` e o `categoria:` dentro do frontmatter.
- **Imagem não aparece**: confira se está em `public/imagens/` e se o Markdown começa em `/imagens/`.
- **Cópia bloqueada**: use `http://localhost:3000` ou HTTPS; a Clipboard API funciona apenas em contextos seguros.
- **`Conteúdo inválido`**: veja o arquivo e o campo mencionados pelo Zod/validador; corrija sem alterar as outras seções.
- **Aviso de Hydration envolvendo `data-bry-content-script-soc`**: teste sem a extensão que injeta o atributo no navegador; não é criado pelo projeto.

Ao terminar, responda **“ok, próxima”** para a Fase 4 — busca rápida.
