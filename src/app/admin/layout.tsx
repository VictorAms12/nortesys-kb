import type { ReactNode } from "react";
import { exigirPapel } from "../../lib/autenticacao-servidor";
export const dynamic="force-dynamic";
export default async function LayoutAdmin({children}:{children:ReactNode}) {
  const usuario=await exigirPapel(["administrador","editor"]);
  return <main id="conteudo" className="conteiner py-9 sm:py-12"><div className="mb-8"><p className="sobre-titulo">Administração · {usuario.papel}</p><h1 className="titulo-pagina mt-2">Painel administrativo</h1><p className="mt-3 texto-introducao">Gerencie conteúdos e acompanhe a operação da base de conhecimento.</p></div>{children}</main>;
}
