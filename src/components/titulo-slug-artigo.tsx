"use client";
import { useState } from "react";
export function slugificarTitulo(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0,100).replace(/-+$/,"");
}
export function TituloSlugArtigo({ tituloInicial, slugInicial, className }: { tituloInicial:string; slugInicial:string; className:string }) {
  const [titulo,setTitulo]=useState(tituloInicial);
  const [slug,setSlug]=useState(slugInicial||slugificarTitulo(tituloInicial));
  const [automatico,setAutomatico]=useState(!slugInicial);
  return <>
    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Título
      <input className={className} name="titulo" minLength={5} maxLength={180} required value={titulo}
        onChange={e=>{const novo=e.target.value;setTitulo(novo);if(automatico)setSlug(slugificarTitulo(novo));}}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Identificador do artigo (slug)
      <input className={className} name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100}
        required value={slug} placeholder="exemplo-procedimento"
        onChange={e=>{setSlug(e.target.value.toLowerCase());setAutomatico(false);}}/>
      <span className="text-xs font-normal text-[var(--muted)]">Gerado pelo título; você pode personalizar.</span>
    </label>
  </>;
}
