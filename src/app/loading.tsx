export default function Carregando() {
  return <div className="conteiner py-10" role="status" aria-live="polite" aria-busy="true">
    <p className="text-sm text-[var(--muted)]">Carregando conteúdo...</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map(item => <div key={item} className="cartao h-36 motion-safe:animate-pulse" />)}
    </div>
  </div>;
}
