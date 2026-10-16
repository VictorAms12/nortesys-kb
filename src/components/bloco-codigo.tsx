"use client";

import { useState } from "react";

export function BlocoCodigo({ codigo, idioma }: { codigo: string; idioma?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try { await navigator.clipboard.writeText(codigo); setCopiado(true); }
    catch { setCopiado(false); }
  }
  return (
    <div className="bloco-codigo my-4 overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 text-xs">
        <span className="font-semibold">{idioma || "Texto / comando"}</span>
        <button className="botao-copiar no-print" type="button" onClick={copiar}>{copiado ? "Copiado ✓" : "Copiar"}</button>
      </div>
      <pre className="m-0 overflow-x-auto p-4 text-sm leading-6"><code>{codigo}</code></pre>
    </div>
  );
}
