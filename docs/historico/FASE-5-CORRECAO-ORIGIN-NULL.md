> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Fase 5 - Correção do login (Origin null)

## Causa
O projeto definiu `Referrer-Policy: no-referrer` no `next.config.ts`.
Em um envio HTML `POST` (formulário), navegadores podem enviar `Origin: null` sob essa política. A verificação CSRF existente rejeita esse cabeçalho com `ORIGIN_INVALIDO` (HTTP 403).

## Alteração mínima
No `next.config.ts`, alteramos `Referrer-Policy` de `no-referrer` para `same-origin`. A política evita enviar `Referer` em requisições para outras origens e deixa os envios internos de formulário informarem o `Origin` de localhost.

NÃO modifique nem desabilite `src/lib/origem.ts` e não altere as chaves de sessão.

## Aplicação
1. Encerre o servidor (`Ctrl+C`).
2. Extraia este ZIP diretamente em `C:\nortesys-kb-fase1` e substitua `next.config.ts`.
3. No terminal do VS Code, execute:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm.cmd run testar:seguranca
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

4. Abra **http://localhost:3000/entrar** em uma nova aba e faça login. Em Chrome F12 > Rede > POST /api/autenticacao/entrar > Cabeçalhos, o esperado é `Origin: http://localhost:3000` e `Sec-Fetch-Site: same-origin`.
5. Verifique redirecionamento após login e funcionamento do botão Sair.

Se persistir `ORIGIN_INVALIDO`, confira o valor exato do cabeçalho `Origin` no POST; não envie dados do formulário, cookies, tokens ou senhas.

Nota: `GET /api/autenticacao/entrar` retornar HTTP 405 é esperado; login usa POST.
