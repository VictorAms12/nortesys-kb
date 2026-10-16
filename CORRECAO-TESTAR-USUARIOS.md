# Fase 5.5 — Correção do teste de usuários (CommonJS)

O arquivo `scripts/testar-usuarios.ts` não utiliza mais `await` no topo do módulo.
A rotina de teste é executada dentro de `async function executarTestes()` e falhas geram código de saída diferente de zero.

## Aplicar
1. Pare o terminal/servidor, caso necessário.
2. Extraia este ZIP na raiz do projeto (pasta que contém `package.json`).
3. Autorize substituir `scripts/testar-usuarios.ts`.
4. Rode:

```powershell
npm.cmd run testar:usuarios
npm.cmd run verificar:fase55
```

O ambiente de teste ainda precisa de `npm install` e das dependências locais.
Esta alteração não modifica `DATABASE_URL`, tabelas, contas nem `.env.local`.
