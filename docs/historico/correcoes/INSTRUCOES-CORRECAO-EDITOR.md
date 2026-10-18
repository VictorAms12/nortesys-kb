> Documento historico. Retrata uma etapa anterior; use o [indice atual](../../README.md) para configurar e operar o projeto.

# Nortesys KB - Fase 7B: correção do editor Markdown (React ESLint)

## Problema

`react-hooks/set-state-in-effect`: o editor restaurava o rascunho com setState síncrono no corpo de um useEffect.

## Alteração

- A restauração do rascunho do sessionStorage passa a ocorrer no callback assíncrono de um timer de 0 ms.
- O timer é cancelado ao desmontar o componente.
- O salvamento automático é suspenso até a leitura inicial do rascunho estar concluída, evitando substituir dados anteriores.
- Nenhuma mudança no banco de dados, autenticação ou conteúdo dos artigos.

## Instalação

Extraia este ZIP na raiz do projeto e substitua:

`src/components/editor-markdown.tsx`

Use Git Bash:

```bash
npm run lint
npm run testar:fase7b
npm run verificar:fase7b
```

Em seguida, execute `npm run dev` e confira: escrever um rascunho, esperar pelo salvamento, atualizar a página, validar a restauração e descartar rascunho.

## Observação

O scanner de dados sensíveis, os testes estruturais 7A/7B e a análise sintática TSX passaram no ambiente de preparação. A execução do lint completo e do build depende das dependências instaladas no seu PC.
