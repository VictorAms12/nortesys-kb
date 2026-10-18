> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

CORREÇÃO DE LOGIN - FASE 5 (Origem inválida / HTTP 403)

Este pacote é destinado ao projeto Nortesys KB que já está na Fase 5.

ARQUIVOS ALTERADOS
- src/lib/origem.ts
- src/app/api/autenticacao/entrar/route.ts
- src/app/api/autenticacao/sair/route.ts
- tests/testar-seguranca.ts

O QUE MUDA
- Além da comparação Origin/Host, aceita formulários marcados pelo navegador
  como Sec-Fetch-Site: same-origin, mesmo quando um proxy reescreve Host.
- Permite Referer de mesmo Host para navegadores legados sem Origin.
- Continua bloqueando cross-site, same-site, Origin 'null' e origens inválidas.
- No modo de desenvolvimento, HTTP 403 mostra código de diagnóstico entre [].
  NÃO inclua sua senha nem o conteúdo do arquivo .env.local ao relatar erros.

INSTALAÇÃO NO WINDOWS
1. Pare npm run dev / npm run start com Ctrl+C.
2. Extraia o ZIP nesta pasta de projeto: C:\nortesys-kb-fase1
   IMPORTANTE: a pasta src do ZIP deve ficar DIRETAMENTE em C:\nortesys-kb-fase1\src,
   NÃO em uma nova subpasta.
3. Confirme que src\lib\origem.ts contém a função verificarOrigemPost.
4. Remova o cache da compilação, opcional se houver código antigo:
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
5. npm.cmd run testar:seguranca
6. npm.cmd run lint
7. npm.cmd run build
8. npm.cmd run dev
9. Acesse http://localhost:3000/entrar, informe sua senha e teste Sair.

SE PERSISTIR
- F12 > Rede (Network) > POST /api/autenticacao/entrar > Cabeçalhos.
- Confirme o método POST e informe SOMENTE estes campos:
  Origin, Host, Referer (se existir), Sec-Fetch-Site e status HTTP.
  NÃO envie Cookie, senha, Set-Cookie nem payload/form data.
- Copie também o código exibido após 'Origem inválida [...]'.

Observação: não alteramos KB_PASSWORD, KB_SESSION_SECRET, .env.local nem artigos.
Antes de disponibilizar na internet, verifique a segurança do ambiente e da autenticação.
