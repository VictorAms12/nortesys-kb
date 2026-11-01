import type { FrontmatterArtigo } from "../types/artigo";

export function EtiquetaStatus({ status }: { status: FrontmatterArtigo["status"] }) {
  return <span className="etiqueta-status" data-status={status}>{status}</span>;
}
