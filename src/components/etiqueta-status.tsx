import type { FrontmatterArtigo } from "../types/artigo";

const estilos: Record<FrontmatterArtigo["status"], string> = {
  rascunho: "border-amber-300 bg-amber-50 text-amber-900 dark-safe-warning",
  revisado: "border-emerald-300 bg-emerald-50 text-emerald-900 dark-safe-success",
  obsoleto: "border-rose-300 bg-rose-50 text-rose-900 dark-safe-danger",
};

export function EtiquetaStatus({ status }: { status: FrontmatterArtigo["status"] }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${estilos[status]}`}>
      {status}
    </span>
  );
}
