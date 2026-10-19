import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { NOME_COOKIE, destinoSeguro, validarTokenSessao } from "./lib/sessao";

function csp(nonce: string): string {
  const desenvolvimento = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${desenvolvimento ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://main.realtime.ably.net${desenvolvimento ? " ws: wss:" : ""}`,
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(req: NextRequest) {
  const rota = req.nextUrl.pathname;
  const publica = rota === "/entrar" || rota === "/api/autenticacao/entrar" || rota === "/robots.txt";
  let sessaoValida = false;
  try {
    if (req.cookies.has(NOME_COOKIE)) sessaoValida = await validarTokenSessao(req.cookies.get(NOME_COOKIE)?.value);
  } catch { sessaoValida = false; } // Falha no banco nunca libera acesso.
  const nonce = randomBytes(16).toString("base64");
  const politica = csp(nonce);
  let resposta: NextResponse;
  if (!publica && !sessaoValida) {
    if (rota.startsWith("/api/")) resposta = NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    else {
      const url = new URL("/entrar", req.url);
      const retorno = destinoSeguro(rota + req.nextUrl.search);
      if (retorno !== "/") url.searchParams.set("retorno", retorno);
      resposta = NextResponse.redirect(url);
    }
  } else if (rota === "/entrar" && sessaoValida) {
    resposta = NextResponse.redirect(new URL("/", req.url));
  } else {
    const cabecalhos = new Headers(req.headers);
    cabecalhos.set("x-nonce", nonce);
    cabecalhos.set("Content-Security-Policy", politica);
    resposta = NextResponse.next({ request: { headers: cabecalhos } });
  }
  resposta.headers.set("Content-Security-Policy", politica);
  resposta.headers.set("Cache-Control", "private, no-store, max-age=0");
  resposta.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return resposta;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"] };
