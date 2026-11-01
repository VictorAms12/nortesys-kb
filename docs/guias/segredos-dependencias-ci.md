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
