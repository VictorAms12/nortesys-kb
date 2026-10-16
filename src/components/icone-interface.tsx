import type { ReactNode, SVGProps } from "react";

export type NomeIcone = "inicio"|"busca"|"livro"|"categorias"|"painel"|"usuarios"|"artigos"|"auditoria"|"menu"|"fechar"|"recolher"|"expandir"|"sair"|"seta"|"escudo"|"ajustes"|"relogio"|"arquivo"|"favoritos"|"recentes";

const caminhos: Record<NomeIcone, ReactNode> = {
  inicio: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  busca: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
  livro: <><path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1zM12 7v13"/></>,
  categorias: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  painel: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></>,
  usuarios: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2zM16 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5"/></>,
  artigos: <><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h6"/></>,
  auditoria: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M4 5l-2 2"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  fechar: <><path d="M5 5l14 14M19 5 5 19"/></>,
  recolher: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M16 9l-3 3 3 3"/></>,
  expandir: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 9l3 3-3 3"/></>,
  sair: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M9 12h9"/></>,
  seta: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  escudo: <><path d="M12 2 4 5v6c0 5 3.4 8.2 8 11 4.6-2.8 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></>,
  ajustes: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,
  relogio: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
  favoritos: <><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.08 6.27L12 17.35l-5.63 2.97 1.08-6.27L2.9 9.6l6.3-.9z"/></>,
  recentes: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
  arquivo: <><path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h5"/></>,
};
export function IconeInterface({nome,...props}:{nome:NomeIcone}&SVGProps<SVGSVGElement>) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{caminhos[nome]}</svg>;
}
