# Nortesys KB — Fase 6: correção dos avisos do ESLint

Corrige exatamente dois pontos:

- `scripts/db-usuarios.mjs`: remove import não utilizado `existsSync`.
- `src/components/formulario-artigo.tsx`: usa `Link` de `next/link` na navegação **Cancelar** para `/admin/artigos`.

## Aplicação

1. Pare o servidor de desenvolvimento (se estiver aberto).
2. Extraia o conteúdo deste ZIP em `C:\nortesys-kb-fase1`, mantendo a estrutura de pastas e substituindo os dois arquivos.
3. Execute no terminal do VS Code:

```powershell
npm.cmd run lint
npm.cmd run build
```

Esta correção não modifica a conexão com o Neon, o `.env.local`, migrações ou contas.
