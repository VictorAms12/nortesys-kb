/** Política CSP com nonce; não ler nem registrar conteúdo do usuário. */
export function montarCsp(nonce:string,producao=process.env.NODE_ENV==="production"):string {
 return [
  "default-src 'self'",
  "script-src 'self' 'nonce-"+nonce+"'"+(producao?"":" 'unsafe-eval'"),
  // Next e componentes existentes aplicam style attributes inline sem nonce.
  // Remover unsafe-inline exige antes migrar esses estilos, proibido nesta rodada.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://main.realtime.ably.net"+(producao?"":" ws: wss:"),
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ...(producao?["upgrade-insecure-requests"]:[]),
 ].join("; ");
}
