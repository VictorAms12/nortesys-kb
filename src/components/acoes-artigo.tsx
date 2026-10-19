"use client";

import { useState } from "react";
import Link from "next/link";

export function AcoesArtigo({ passos }: { passos: string }) {
  const [mensagem, setMensagem] = useState("");
  async function copiar(texto: string, sucesso: string) {
    try { await navigator.clipboard.writeText(texto); setMensagem(sucesso); }
    catch { setMensagem("O navegador bloqueou a cópia. Use HTTPS ou localhost."); }
  }
  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-2" aria-label="Ações deste artigo">
      {passos && <button type="button" className="botao-primario" onClick={()=>copiar(passos,"Passos copiados!")}>Copiar passos</button>}
      <button type="button" className="botao-secundario" onClick={()=>copiar(window.location.href,"Link copiado!")}>Copiar link</button>
      <button type="button" className="botao-secundario" onClick={()=>window.print()}>Imprimir</button>
      <Link className="botao-secundario" href="/ferramentas/registro">Registrar atendimento</Link>
      <span className="text-xs text-[var(--muted)]" role="status" aria-live="polite">{mensagem}</span>
    </div>
  );
}
