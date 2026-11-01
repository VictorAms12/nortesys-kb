# Segredos, dependências e histórico Git

O repositório **é público**. Trate qualquer valor publicado no histórico como comprometido, ainda que o commit atual tenha sido corrigido. Nunca versionar `.env.local`, dumps PostgreSQL, tokens Blob, cookies de sessão, chaves VAPID ou credenciais Ably.

## Proteções

- Workflow de push e pull request: GitHub Actions executa Gitleaks v3 com `fetch-depth: 0` para tornar todo o histórico disponível ao analisador; relatório visual/artefatos e comentários desativados para não propagar achados.
- `npm audit --omit=dev --audit-level=high` bloqueia dependências de produção com HIGH/CRITICAL. `npm audit` completo (dev incluídas) permanece informativo, pois alterações de toolchain exigem revisão.
- GitHub > Settings > Security / Code security and analysis: **habilitar e conferir** Secret scanning e Push protection quando disponíveis no plano. Esta PR não pode confirmar que estão ativados; um administrador deve validar no painel.
- Testes não rodam com segredos reais, banco de produção nem acesso a tokens. Evitar expor achados no log da CI.

## Inspeção de histórico e tratamento de descobertas

Use Git clone completo ou checkout com `fetch-depth: 0`, gitleaks no modo Git com redação (`--redact`), varrendo todos os commits. Registre somente tipo, caminho e commit do achado; **nunca o valor**. Identifique provedor e dono da credencial e revogue/rotacione conforme [backup e resposta a incidentes](backup-restauracao.md). Reescrever o histórico não substitui rotação, pois cópias anteriores podem permanecer acessíveis.

**Limites:** até o resultado da CI, não há conclusão sobre segredos antigos, nem sobre a ativação de Secret scanning/Push protection na conta. Um `npm audit` sem achados não substitui revisão de permissões ou atualizações de dependências.

## Correção de Zod transitivo no Vercel Blob (GHSA-mrhx-c7xc-m3w5)

Em 01/11/2026 o lockfile tinha `zod@4.6.7` na aplicação, mas `@vercel/blob@2.8.2` dependia de `@vercel/oidc@3.8.10` → `@vercel/cli-config@0.3.1`, que declarava `zod@4.1.11` **exato**, vulnerável ao DoS por consumo excessivo de memória. A correção preserva as versões Vercel e utiliza `overrides` **somente** em `@vercel/cli-config` para exigir Zod `^4.6.6`, reaproveitando o `4.6.7` já presente no lockfile. A dependência direta `zod` também passa a exigir `^4.6.6` para evitar downgrade futuro. O manifesto original da dependência terceira continua declarando a versão antiga; é o override do projeto que corrige a resolução.

**Validação necessária antes de mesclar:** GitHub Actions deve concluir `npm ci`, `npm run verificar:regras`, lint, formatação, TypeScript, `npm audit --omit=dev --audit-level=high` sem HIGH/CRITICAL e build Preview Vercel; validar upload e leitura de imagens privadas, e a autenticação Vercel OIDC quando disponível. Se `npm ci` ou os testes falharem, ajustar/reverter a mudança na branch. Remover o override futuramente somente quando `@vercel/cli-config` permitir nativamente `zod>=4.6.6` e `npm audit` continuar limpo.
