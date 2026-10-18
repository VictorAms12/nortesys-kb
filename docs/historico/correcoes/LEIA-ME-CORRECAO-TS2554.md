> Documento historico. Retrata uma etapa anterior; use o [indice atual](../../README.md) para configurar e operar o projeto.

# Nortesys KB — Correção TypeScript TS2554 (Fase 5.5)

## Motivo
`promisify(scrypt)` é inferido como assinatura de 3 argumentos pelo TypeScript e o código tentava passar opções como 4º parâmetro.

## Arquivos modificados
- `src/lib/usuarios.ts`: função assíncrona `derivarHashSenha` utiliza `scrypt` com as mesmas opções anteriores e `Promise`.
- `tests/testar-usuarios.ts`: o teste utiliza `derivarHashSenha` e a compara com `scryptSync`, verificando compatibilidade.

## Como instalar
1. Pare o servidor.
2. Extraia o ZIP em `C:\nortesys-kb-fase1`, mantendo a estrutura de diretórios e substituindo apenas estes dois arquivos.
3. Não apague `.env.local` e não execute nova migração apenas por causa desta correção.
4. Execute:

```powershell
npm.cmd run testar:usuarios
npm.cmd run verificar:fase55
```

Também é possível executar `npm.cmd run build` separadamente. Se tudo passar, teste login/logout na interface.

## O que foi verificado
- TypeScript dos módulos envolvidos, com declarações Node e um adaptador local da API do Neon: sem erros.
- Testes locais da derivação de senha, formato de usuário, papéis e cookies: passaram.
- Build completo do Next.js e conexão com Neon ainda precisam ser testados no computador com as dependências instaladas.
