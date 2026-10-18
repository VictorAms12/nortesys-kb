// Mantém preferências nesta aba quando o navegador bloqueia localStorage.
const temporarias = new Map<string, string>();

export function lerPreferencia(chave: string): string | null {
  if (temporarias.has(chave)) return temporarias.get(chave)!;
  try { return window.localStorage.getItem(chave); }
  catch { return temporarias.get(chave) ?? null; }
}

export function salvarPreferencia(chave: string, valor: string): void {
  try { window.localStorage.setItem(chave, valor); temporarias.delete(chave); }
  catch { temporarias.set(chave, valor); }
}
