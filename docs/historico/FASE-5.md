> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Fase 5 — Autenticação e Segurança

> **Atualização:** este documento descreve o projeto original com senha compartilhada. A versão atual utiliza contas individuais. Para configurar e validar, veja `docs/historico/FASE-5-CONTAS-INDIVIDUAIS.md` e o README. `KB_PASSWORD` foi substituída por `KB_USERS`.


## Objetivo

Restringir acesso à base de conhecimento e reduzir a chance de inclusão acidental de dados pessoais ou segredos no código e artigos.

## O que entrou

1. `/entrar`: tela pública para senha única, configurada no servidor por `KB_PASSWORD`.
2. `/api/autenticacao/entrar`: verificação de senha, controle básico de erros e emissão de cookie HttpOnly.
3. `/api/autenticacao/sair`: remoção do cookie e retorno ao login.
4. `src/proxy.ts`: bloqueia páginas e API antes de renderizar, com CSP e sem cache de conteúdo privado.
5. `src/lib/autenticacao-servidor.ts`: valida a sessão novamente em cada página e nas rotas de conteúdo.
6. `src/lib/sessao.ts`: tokens com assinatura HMAC, expiração e validação de retorno.
7. `next.config.ts`: cabeçalhos HTTP de segurança; `src/app/robots.ts`: bloqueio de indexação.
8. `scripts/verificar-dados-sensiveis.mjs`: scanner pré-build com arquivo/linha sem exibir os valores suspeitos.
9. `tests/testar-seguranca.ts`: testes de assinatura, expiração, cookie, tentativas e auditoria.

## Preparação

- No terminal da pasta principal, execute `npm.cmd install`.
- Crie `.env.local` copiando `.env.example`.
- Defina `KB_PASSWORD` (mínimo 12 caracteres) e `KB_SESSION_SECRET` (mínimo 32 caracteres, criado por `npm.cmd run gerar:segredo`).
- Reinicie `npm.cmd run dev`. Senha e segredo não devem aparecer em nenhum arquivo versionado.
- Em produção, use HTTPS, configurações privadas na hospedagem e GitHub privado.

## Testes essenciais

```powershell
npm.cmd run verificar:estrutura
npm.cmd run verificar
npm.cmd run validar:artigos
npm.cmd run testar:validacao
npm.cmd run testar:busca
npm.cmd run testar:seguranca
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

### Conferência manual no navegador

1. Acesse `/busca` sem login: deve redirecionar para `/entrar`.
2. Abra `/artigos/cadastros/cliente-duplicado` sem login: também deve redirecionar.
3. Senha incorreta: deve negar o acesso; após 5 falhas, deve bloquear novas tentativas por 15 minutos **na mesma instância**.
4. Senha correta: libera a base; artigos, filtros, Ctrl+K e tema continuam funcionando.
5. Clique **Sair**: retorno ao login; voltar à busca deve pedir senha novamente.
6. Abra as DevTools > Application > Cookies: cookie deve ser HttpOnly, SameSite Strict, sem valor de senha e com expiração. Secure só em produção HTTPS.
7. Em DevTools > Network, confira `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy` e `X-Robots-Tag`.
8. Abra `/robots.txt` para confirmar bloqueio de todos os robôs.
9. Insira um dado fictício de exemplo que corresponda ao scanner num arquivo `.md` temporário, execute `npm.cmd run verificar` e confira que falha com localização arquivo/linha. **Remova o arquivo** antes de seguir.
10. Faça `npm.cmd run build` sem erros; confira ausência de conteúdo interno acessível a visitantes anônimos.

## Limitações explícitas

A senha é compartilhada e não há identidade individual, MFA, revogação por pessoa nem rate limiting distribuído. Não considere esta fase uma solução final de identidade corporativa. Na Fase 7, revisar proteção no provedor, CDN, HTTPS e segredo de ambiente antes de disponibilizar fora da rede interna.
