"use client";

import Link from "next/link";

export default function FalhaPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="conteiner py-10" aria-labelledby="titulo-falha">
    <div className="cartao p-6" role="alert">
      <h1 id="titulo-falha" className="text-xl font-bold">Não foi possível carregar esta página</h1>
      <p className="mt-3 text-[var(--muted)]">O serviço pode estar temporariamente indisponível. Tente novamente em alguns instantes.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="botao-primario" onClick={reset}>Tentar novamente</button>
        <Link href="/" className="botao-secundario">Voltar ao início</Link>
      </div>
    </div>
  </section>;
}
