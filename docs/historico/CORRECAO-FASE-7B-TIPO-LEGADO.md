> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Nortesys KB — Correção da Fase 7B (tipo ausente no teste da Fase 6)

## Problema

`npm run verificar:fase7b` interrompia em `npm run testar:fase6` com `ZodError` na propriedade `tipo`. O formulário da Fase 6 não incluía esse campo, introduzido somente na 7B.

## Solução

Em `src/lib/formulario-artigo.ts`, quando `tipo` não é informado ou vem vazio, o formulário usa `solucao`, exatamente como já fazia a leitura do frontmatter dos artigos antigos. Valores explícitos desconhecidos continuam sendo rejeitados.

Em `tests/testar-fase6.ts`, foram acrescentadas verificações para:

- formulário antigo, sem `tipo`, entendido como `solucao`;
- formulário novo com `tipo=tutorial` e cinco seções;
- rejeição de `tipo` inválido;
- rejeição de conteúdo sem a estrutura obrigatória.

## Instalação (Git Bash no Windows)

Extraia o ZIP de correção na **raiz do repositório**, preservando os caminhos `src/lib/` e `scripts/` e substituindo os arquivos correspondentes. O ZIP também inclui este documento.

Verifique primeiro:

```bash
npm run testar:fase6
npm run testar:fase7b
npm run verificar:fase7b
```

Não é necessário reinstalar as dependências, executar `db:migrar` nem alterar o `.env.local` ou os usuários.

## Validação realizada

Verificações estáticas de sintaxe dos dois arquivos modificados; testes estruturais 7A e 7B; auditoria preventiva de dados sensíveis. O teste com dependências (`tsx`) e o build completo devem ser confirmados localmente no PC.
