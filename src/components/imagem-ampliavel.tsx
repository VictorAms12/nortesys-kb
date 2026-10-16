"use client";

import Image from "next/image";
import { useRef } from "react";

export function ImagemAmpliavel({ src, alt, legenda }: { src: string; alt: string; legenda?: string }) {
  const modal = useRef<HTMLDialogElement>(null);
  return (
    <figure className="my-5">
      <button className="imagem-clicavel no-print" type="button" onClick={()=>modal.current?.showModal()} aria-label={`Ampliar imagem: ${alt}`}>
        <Image src={src} alt={alt} width={1120} height={720} className="h-auto max-h-96 w-full rounded-xl object-contain" sizes="(max-width: 768px) 100vw, 850px" />
      </button>
      <div className="somente-impressao"><Image src={src} alt={alt} width={900} height={600} unoptimized /></div>
      {legenda && <figcaption className="mt-2 text-center text-sm text-[var(--muted)]">{legenda}</figcaption>}
      <dialog ref={modal} className="modal-imagem no-print" aria-label={`Imagem ampliada: ${alt}`}
        onClick={e=>{ if(e.target === e.currentTarget) modal.current?.close(); }}>
        <button className="fechar-imagem" type="button" onClick={()=>modal.current?.close()} aria-label="Fechar imagem">✕ Fechar</button>
        <Image src={src} alt={alt} width={1600} height={1200} className="max-h-[84vh] max-w-[94vw] object-contain" sizes="94vw" />
      </dialog>
    </figure>
  );
}
