> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Nortesys KB — Protótipo de upload de imagens (somente localhost)

> Guia histórico do protótipo. A Fase 7C.1 passou o botão do editor para Blob privado em todos os ambientes. Use agora [FASE-7C1-UPLOAD-DEFINITIVO.md](FASE-7C1-UPLOAD-DEFINITIVO.md). A rota local continua restrita ao desenvolvimento, mas não é mais chamada pelo botão.

## Objetivo
Testar a inserção de prints diretamente pelo editor de artigos, **sem alterar a produção**.

## Instalação
1. `git status -sb`: verifique se seu repositório está limpo e salve alterações importantes.
2. `git switch main && git pull --ff-only origin main` (somente se não houver mudanças pendentes).
3. `git switch -c teste-upload-imagens-local` (ou utilize uma branch de testes já criada).
4. Extraia o ZIP **na raiz do projeto**, substituindo somente os arquivos correspondentes.
5. Execute:
   ```bash
   npx tsx scripts/testar-upload-imagens-local.ts
   npm run lint
   npm run build
   npm run dev
   ```
6. Abra `http://localhost:3000/entrar`, entre como **administrador** ou **editor**.
7. Em Administração → Gerenciar artigos → Novo artigo, localize o botão **Enviar print (teste local)**.
8. Clique no conteúdo na posição desejada, selecione um PNG, JPG ou WebP **até 2 MB**.
9. Espere a confirmação. O editor inserirá `![descrição](../imagens/uploads-locais/uuid.webp)` automaticamente.
10. Clique em **Pré-visualizar**: a imagem deverá aparecer e ampliar ao clicar.
11. Para testar **sem mexer no banco**, não clique em Criar artigo ou Salvar. Se quiser persistir um artigo, use um banco de desenvolvimento isolado: o formulário de artigos existente **grava no Neon configurado no .env.local**.

## Onde os arquivos ficam

`public/imagens/uploads-locais/` — diretório criado automaticamente. Está no `.gitignore` para evitar commits acidentais.

As URLs das imagens passam pela autenticação existente no proxy. Use capturas fictícias para os testes locais.

## Limitações intencionais
- Upload só quando `NODE_ENV=development` e `Host` for `localhost` ou `127.0.0.1`.
- PNG/JPG/WebP com conferência de assinatura e máximo de 2 MiB; SVG e GIF não são aceitos.
- Autenticação real com conta **editor ou administrador** e validação de origem.
- A imagem é gravada imediatamente, mesmo que o artigo não seja salvo: para apagar descartes, limpe manualmente apenas `public/imagens/uploads-locais/`.
- Nenhum upload vai para o Neon; o banco só receberá o texto com a referência **caso você salve o artigo**.
- **Não funciona como armazenamento de produção na Vercel**: o sistema de arquivos de funções serverless não persiste upload. A futura versão precisará de storage externo privado, permissões de leitura e controle de descarte.
- `npm run build` pode validar o código, mas o botão não aparecerá em builds de produção.

## Solução de problemas
- **403:** confira o login/perfil ou recarregue a página (validação de origem).
- **404:** você está usando build de produção, um domínio diferente de localhost ou não aplicou a rota.
- **415:** arquivo não é PNG/JPG/WebP válido ou extensão não combina com os bytes.
- **413:** arquivo acima do tamanho máximo.
- **Imagem indisponível:** use o link “Abrir arquivo” para conferir a URL estando autenticado. Confirme que o arquivo existe em `public/imagens/uploads-locais/`.

## Correção da pré-visualização

O arquivo fica em `public/imagens/uploads-locais/UUID.png` e a URL correta é `/imagens/uploads-locais/UUID.png`, sem `/public`. O proxy exige autenticação também nessa URL. O otimizador do Next não encaminha cookies ao buscar a imagem, recebendo o login no lugar dos bytes. Por isso o ampliador usa `unoptimized` em todas as imagens: o navegador acessa a URL diretamente com sua sessão, preservando a proteção existente.

O conteúdo da imagem usa elementos compatíveis com Markdown inline e o diálogo só é montado ao ampliar, em um portal fora do formulário. Links com imagem mantêm um link separado para evitar botão dentro de âncora. Falhas de carregamento exibem um aviso compacto, sem reservar as dimensões da imagem quebrada.

Teste com `npx.cmd --no-install tsx scripts/testar-upload-imagens-local.ts` e `npx.cmd --no-install tsx tests/testar-hidratacao-imagens.ts`. O segundo verifica o HTML renderizado e a preservação da URL ao serializar e validar o artigo em memória; não grava no Neon e não substitui um teste de hidratação em navegador.

No localhost, envie uma captura, confira a referência em **Editar**, abra **Pré-visualizar**, amplie e feche pelo botão, clique no fundo ou pressione Escape. Teste também uma URL inexistente: deve aparecer “Imagem indisponível” sem espaço exagerado. Recarregue a aba para conferir o rascunho. A gravação real do artigo não faz parte desse teste sem banco; só teste Salvar em uma instância de desenvolvimento isolada quando houver autorização para escrita.

## Como desfazer sem perder o restante do projeto
Na branch de testes, execute `git status`. Para descartar **somente os arquivos deste pacote**, com atenção para alterações prévias:
```bash
git restore -- .gitignore src/components/editor-markdown.tsx src/components/conteudo-markdown.tsx
```
Depois remova manualmente os 3 arquivos novos de código/teste (`src/lib/imagens-local.ts`, `src/app/api/admin/imagens-local/route.ts`, `scripts/testar-upload-imagens-local.ts`) e o documento de instruções. Os arquivos de imagem de teste ficam apenas em `public/imagens/uploads-locais/`.
