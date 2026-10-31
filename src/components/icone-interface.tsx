import type { ReactNode, SVGProps } from "react";

export type NomeIcone =
 "inicio"|"busca"|"livro"|"categorias"|"painel"|"usuarios"|"artigos"|"auditoria"|
 "menu"|"fechar"|"recolher"|"expandir"|"sair"|"seta"|"escudo"|"ajustes"|
 "relogio"|"arquivo"|"favoritos"|"recentes"|"mensagem"|"diagnostico"|
 "indicadores"|"manutencao"|"registro"|"erp"|"nota"|"fiscal"|"cadastros"|
 "programas"|"rede"|"procedimentos"|"anexo"|"lua"|"sol"|"monitor"|"filtro"|"copiar";
const caminhos:Record<NomeIcone,ReactNode>={
 inicio:<><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 21v-8h6v8"/></>,
 busca:<><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
 livro:<><path d="M12 7c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1zM12 7v13"/></>,
 categorias:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 painel:<><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></>,
 usuarios:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2zM16 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5"/></>,
 artigos:<><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h6"/></>,
 auditoria:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
 fechar:<><path d="M5 5l14 14M19 5 5 19"/></>,
 recolher:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M16 9l-3 3 3 3"/></>,
 expandir:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 9l3 3-3 3"/></>,
 sair:<><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M9 12h9"/></>,
 seta:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,
 escudo:<><path d="M12 2 4 5v6c0 5 3.4 8.2 8 11 4.6-2.8 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></>,
 ajustes:<><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="3"/></>,
 relogio:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
 favoritos:<><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.08 6.27L12 17.35l-5.63 2.97 1.08-6.27L2.9 9.6l6.3-.9z"/></>,
 recentes:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
 arquivo:<><path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h5"/></>,
 mensagem:<><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l2-4.5A8.5 8.5 0 1 1 21 11.5z"/></>,
 diagnostico:<><path d="M6 3v5a6 6 0 0 0 12 0V3M3 3h6M15 3h6M12 14v3a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="14" r="2"/></>,
 indicadores:<><path d="M4 20V4M4 20h17M8 16v-4M13 16V7M18 16V9"/></>,
 manutencao:<><path d="M14 7a5 5 0 0 0-6-5l3 3-3 3-3-3A5 5 0 0 0 7 14l-5 5 3 3 5-5a5 5 0 0 0 7-7z"/></>,
 registro:<><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4"/></>,
 erp:<><rect x="3" y="4" width="18" height="15" rx="1"/><path d="M3 9h18M7 14h3M13 14h4"/></>,
 nota:<><path d="M5 2h14v20l-3-2-4 2-4-2-3 2zM9 7h6M9 11h6M9 15h4"/></>,
 fiscal:<><path d="M3 21h18M6 21V8l6-5 6 5v13M9 11h6M9 15h6"/></>,
 cadastros:<><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 8h5M19.5 5.5v5"/></>,
 programas:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></>,
 rede:<><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v5M5 16v-4h14v4"/></>,
 procedimentos:<><path d="m5 12 4 4L19 6M4 3h16v18H4"/></>,
 anexo:<><path d="M8 12.5 14.8 5.7a4 4 0 0 1 5.7 5.7l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2"/></>,
 lua:<><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z"/></>,
 sol:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
 monitor:<><rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8M12 18v4"/></>,
 filtro:<><path d="M4 5h16l-6 7v7l-4 2v-9z"/></>,
 copiar:<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
};
export function IconeInterface({nome,...props}:{nome:NomeIcone}&SVGProps<SVGSVGElement>){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none"
 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>{caminhos[nome]}</svg>;
}
