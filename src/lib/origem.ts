/**
 * Proteção contra CSRF em POSTs de formulário.
 *
 * 1. Sec-Fetch-Site é um cabeçalho protegido pelo navegador. `same-origin`
 *    é evidência suficiente de um formulário aberto na própria origem, mesmo
 *    se Host tiver sido reescrito por proxy/ambiente de desenvolvimento.
 * 2. Quando esse cabeçalho não existe (clientes antigos), exigimos Origin ou
 *    Referer compatível com Host. Nunca aceitamos uma requisição sem prova.
 * 3. `same-site` NÃO equivale a `same-origin`.
 */
export type MotivoOrigem =
  | "FETCH_SITE_EXTERNO"
  | "ORIGIN_INVALIDO"
  | "ORIGIN_HOST_DIVERGENTE"
  | "REFERER_HOST_DIVERGENTE"
  | "CABECALHOS_AUSENTES";

export type ResultadoOrigem = { valida: true } | { valida: false; motivo: MotivoOrigem };

function urlHttpValida(valor: string): URL | null {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function mesmoHost(url: URL, host: string | null): boolean {
  return !!host && url.host.toLowerCase() === host.trim().toLowerCase();
}

export function verificarOrigemPost(cabecalhos: Pick<Headers, "get">): ResultadoOrigem {
  const site = cabecalhos.get("sec-fetch-site")?.trim().toLowerCase();
  // `same-site` também deve ser rejeitado: subdomínio não é a mesma origem.
  if (site && site !== "same-origin" && site !== "none") {
    return { valida: false, motivo: "FETCH_SITE_EXTERNO" };
  }

  const host = cabecalhos.get("host");
  const origem = cabecalhos.get("origin")?.trim();
  const referer = cabecalhos.get("referer")?.trim();

  // Se Origin estiver presente e for opaco/malformado, rejeitar sempre.
  if (origem) {
    const url = urlHttpValida(origem);
    if (!url || url.origin !== origem) return { valida: false, motivo: "ORIGIN_INVALIDO" };
    // Mesmo com proxy que reescreve Host, o navegador marca o envio da página
    // atual como same-origin. Não usar X-Forwarded-Host informado pelo cliente.
    if (site === "same-origin" || mesmoHost(url, host)) return { valida: true };
    return { valida: false, motivo: "ORIGIN_HOST_DIVERGENTE" };
  }

  // Alguns clientes ou extensões omitem Origin, mas navegadores modernos
  // continuam enviando Sec-Fetch-Site nos formulários de mesma origem.
  if (site === "same-origin") return { valida: true };

  // Compatibilidade com navegadores legados: Referer exato para o Host.
  if (referer) {
    const url = urlHttpValida(referer);
    if (url && mesmoHost(url, host)) return { valida: true };
    return { valida: false, motivo: "REFERER_HOST_DIVERGENTE" };
  }

  return { valida: false, motivo: "CABECALHOS_AUSENTES" };
}

export function origemPostValida(cabecalhos: Pick<Headers, "get">): boolean {
  return verificarOrigemPost(cabecalhos).valida;
}
