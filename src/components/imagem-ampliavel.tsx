"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ImagemAmpliavel({ src, alt, legenda }: { src: string; alt: string; legenda?: string }) {
  const modal = useRef<HTMLDialogElement>(null);
  const [falhou, setFalhou] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  if (falhou) return <span role="status" className="my-2 block rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
    Imagem indisponível: {alt}. <a href={src} target="_blank" rel="noopener noreferrer">Abrir arquivo</a>
  </span>;
  return (
    <span className="my-5 block">
      <button className="imagem-clicavel no-print" type="button" onClick={()=>setAmpliada(true)} aria-label={`Ampliar imagem: ${alt}`}>
        {/* O proxy exige sessão. A URL direta preserva o cookie do navegador. */}
        <Image src={src} alt={alt} width={1120} height={720} unoptimized onError={()=>setFalhou(true)} className="h-auto max-h-96 w-full rounded-xl object-contain" />
      </button>
      <span className="somente-impressao"><Image src={src} alt={alt} width={900} height={600} className="h-auto max-w-full" unoptimized loading="eager" /></span>
      {legenda && <span className="mt-2 block text-center text-sm text-[var(--muted)]">{legenda}</span>}
      {/* Fora da árvore inline do Markdown e do formulário do editor. */}
      {ampliada && createPortal(<dialog ref={elemento=>{ modal.current = elemento; if (elemento && !elemento.open) elemento.showModal(); }} className="modal-imagem no-print" aria-label={`Imagem ampliada: ${alt}`}
        onClose={()=>setAmpliada(false)}
        onClick={e=>{ if(e.target === e.currentTarget) modal.current?.close(); }}>
        <button className="fechar-imagem" type="button" onClick={()=>modal.current?.close()} aria-label="Fechar imagem">✕ Fechar</button>
        <Image src={src} alt={alt} width={1600} height={1200} unoptimized onError={()=>{setFalhou(true);setAmpliada(false);}} className="h-auto w-auto max-h-[84vh] max-w-[94vw] object-contain" />
      </dialog>, document.body)}
    </span>
  );
}
