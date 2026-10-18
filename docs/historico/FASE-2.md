> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Fase 2 — Categorias, Markdown e validação de artigos

> Este projeto é um site local em construção. Ainda não há autenticação nem proteção de conteúdo. Não publique dados internos.

## O que esta fase entrega

- Sete categorias centralizadas em `config/categorias.ts`.
- Tipos em `src/types/artigo.ts`.
- Modelo e regras de frontmatter em `src/lib/schema-artigo.ts`.
- Leitura dos `.md`, validação dos sete tópicos e mensagens de erro em `src/lib/artigos.ts`.
- Um artigo fictício em `content/cadastros/cliente-duplicado.md`.
- Verificador automático e teste de erros propositais, sem alterar artigos.
- Página inicial exibindo os dados carregados. A navegação por páginas de artigos fica para a Fase 3.

## 1. Atualizar no Windows 11

Você pode usar o ZIP de atualização para preservar sua instalação local da Fase 1:

1. Feche o servidor da Fase 1 no PowerShell com `Ctrl+C`.
2. Faça cópia de segurança da pasta do projeto.
3. Abra no VS Code a pasta onde está o arquivo `package.json` da Fase 1.
4. Extraia **o conteúdo** de `Nortesys-KB-Fase-2-Atualizacao.zip` nessa pasta, substituindo os arquivos com nomes iguais. O ZIP de atualização contém apenas arquivos novos ou modificados.
5. No terminal do VS Code, execute:

```powershell
npm.cmd install
```

O comando lê o novo `package.json` e instala as quatro dependências adicionais.

Se preferir usar o ZIP completo, extraia `Nortesys-KB-Fase-2-Completo.zip` em uma pasta nova, abra essa pasta e rode `npm.cmd install`. Não é necessário instalar ou configurar banco de dados.

## 2. Verificar os artigos

```powershell
npm.cmd run validar:artigos
```

Isso deve escrever:

```text
✅ 1 artigo(s) Markdown validado(s).
   • content/cadastros/cliente-duplicado.md (rascunho; N1)
```

**O que acontece?** O script lê todos os arquivos Markdown, valida a parte entre os sinais `---` (frontmatter), confere o nome da pasta e a presença das sete seções.

Teste automático sem modificar os documentos:

```powershell
npm.cmd run testar:validacao
```

Você deve ver quatro mensagens `[OK]` mostrando que a validação rejeitou campos e seções inválidos.

## 3. Rodar o site

```powershell
npm.cmd run dev
```

Abra `http://localhost:3000`. A página deve mostrar:

- o título **A base já consegue ler e validar artigos.**;
- **7 categorias**, **1 artigo válido**;
- o artigo fictício **Cadastro de cliente duplicado no ERP**;
- o status **rascunho**, o nível **N1** e as **7 seções** encontradas.

Para interromper: `Ctrl+C` no terminal.

## 4. Fazer o build

```powershell
npm.cmd run lint
npm.cmd run build
```

O `build` agora executa o validador antes de compilar. Se houver um campo incorreto em qualquer arquivo `.md`, ele para antes de gerar o site.

## 5. Como criar um novo artigo (sem interface ainda)

1. Copie `content/cadastros/cliente-duplicado.md` para a pasta da categoria desejada.
2. Renomeie o arquivo usando letras minúsculas, números e hífens: por exemplo, `erro-de-impressora.md`.
3. No início, ajuste os campos entre `---`, incluindo a categoria correta.
4. Mantenha as **sete seções `##` na ordem exata**. Preencha cada seção.
5. Execute `npm.cmd run validar:artigos`, e só depois `npm.cmd run build`.

**Para artigos das categorias `notas-fiscais` e `fiscal-e-impostos`:** acrescente o campo obrigatório `revisarAte: "2027-01-15"` (escolha uma data de revisão adequada ao conteúdo). Sem esse campo o artigo é recusado.

### Formato dos campos

| Campo | Regra |
|---|---|
| `titulo` | texto obrigatório, não vazio |
| `resumo` | texto obrigatório de até 160 caracteres |
| `categoria` | um dos sete slugs em `config/categorias.ts` |
| `sistema` | texto obrigatório, por exemplo `Geral` |
| `tags` | lista de textos; use `[]` caso não haja tags |
| `codigosErro` | lista opcional de **strings**; escreva `"539"` com aspas |
| `nivel` | somente `N1`, `N2` ou `N3` |
| `autor` | texto obrigatório |
| `criadoEm` | data válida `AAAA-MM-DD` |
| `atualizadoEm` | data válida `AAAA-MM-DD`, não anterior a `criadoEm` |
| `revisarAte` | opcional em geral, obrigatória nas duas categorias fiscais |
| `fonteOficial` | lista opcional de URLs HTTP/HTTPS |
| `status` | `rascunho`, `revisado` ou `obsoleto` |

**Atenção:** datas devem ser de preferência colocadas entre aspas e todas as tags devem ser strings. Se digitar `codigosErro: [539]`, o YAML vai entender como número e o Zod rejeitará, porque o modelo pede string.

### As sete seções obrigatórias

O corpo deve conter exatamente estes títulos Markdown na ordem:

```markdown
## Problema

## Sintomas e mensagem exata

## Causa provável

## Solução passo a passo

## Como confirmar que resolveu

## Se não resolver: quando e para quem escalar

## Artigos relacionados
```

Não deixe nenhuma seção vazia. Use `###` para subtópicos adicionais dentro de uma seção.

## 6. Como testar se um campo inválido derruba o build

Este é um teste manual e reversível. **Guarde uma cópia do artigo original** antes.

1. Abra `content/cadastros/cliente-duplicado.md` no VS Code.
2. Mude `nivel: "N1"` para `nivel: "N4"`.
3. Salve o arquivo.
4. Execute:

```powershell
npm.cmd run build
```

O build deve parar e exibir a indicação do arquivo, junto com `frontmatter.nivel`.

5. Desfaça a alteração: volte a `nivel: "N1"`, salve e rode `npm.cmd run build` novamente. Deve concluir sem erros de conteúdo.

Se preferir evitar modificações, use `npm.cmd run testar:validacao` — ele cobre quatro erros comuns apenas em memória.

## 7. Por que cada pacote foi adicionado

| Pacote | Por quê? |
|---|---|
| `gray-matter` | Separa o YAML do texto Markdown e entrega um objeto com os campos. |
| `zod` | Valida tipos, listas, categorias, datas e regras de revisão; mostra o campo errado. |
| `remark` | Analisa a estrutura do Markdown para conferir títulos reais e seções na ordem (sem confundir texto dentro de códigos). |
| `tsx` (desenvolvimento) | Permite rodar scripts TypeScript diretamente pelo npm, usando o mesmo validador do site e sem duplicar regras em JavaScript. |

Não foi instalado um renderer Markdown/HTML ainda: essa funcionalidade será feita na Fase 3. Não foi instalado Fuse.js ainda: ficará para a Fase 4.

## 8. Erros comuns e soluções

**`Cannot find module 'zod'` ou `gray-matter`**: execute `npm.cmd install` na pasta com `package.json`.

**`frontmatter.nivel`**: use somente `N1`, `N2` ou `N3`.

**`frontmatter.revisarAte`**: nos artigos fiscais, inclua `revisarAte` com data `AAAA-MM-DD`.

**`frontmatter.categoria`**: confira se o nome da categoria no YAML é igual ao da pasta.

**`frontmatter.resumo`**: reduza para 160 caracteres ou menos.

**`corpo.seção N`**: confira o título e a ordem das sete seções com `##`.

**`arquivo: use nome em kebab-case`**: renomeie para `erro-do-sistema.md` em minúsculas, sem acentos.

**`npm run lint` mostra erro de arquivo gerado**: confira se a pasta `.next` está sendo ignorada e se instalou as dependências. Envie o erro completo para análise.

## 9. Próxima fase

A Fase 3 criará páginas individuais para cada artigo, listas filtráveis por categoria, layout responsivo e componentes de apresentação. **Pare aqui e espere a confirmação de aceite da Fase 2.**
