> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Nortesys KB — Correção TS18048 (Fase 4)

## Arquivos corrigidos
- `src/lib/busca.ts`: assume `[]` quando `codigosErro` está ausente antes de usar `some()`.
- `src/components/painel-busca.tsx`: usa `[]` como padrão para contagem e listagem de códigos.

## Instalar no projeto existente
1. Faça backup dos arquivos locais modificados.
2. Extraia `Nortesys-KB-Fase-4-Correcao-TS18048.zip` na raiz do projeto (pasta que contém `package.json`), substituindo os dois arquivos `.ts` e `.tsx`.
3. Execute:

```powershell
npm.cmd run verificar:estrutura
npm.cmd run testar:busca
npm.cmd run lint
npm.cmd run build
```

Como alternativa, o arquivo `Nortesys-KB-Fase-4-Completo-Corrigido.zip` contém a versão completa do projeto já corrigida.

Esta correção é pontual e não altera artigos ou outros dados.
