"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function TransicaoPagina({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  return <div key={caminho} className="entrada-pagina">{children}</div>;
}
