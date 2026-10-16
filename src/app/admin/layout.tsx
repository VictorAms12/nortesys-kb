import Link from "next/link";
import type { ReactNode } from "react";
import { exigirPapel } from "../../lib/autenticacao-servidor";
export const dynamic="force-dynamic";
export default async function LayoutAdmin({children}:{children:ReactNode}) {
  const usuario=await exigirPapel(["administrador","editor"]);
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <div className="mb-6"><p className="sobre-titulo">Área interna · {usuario.papel}</p><h1 className="titulo-pagina">Painel administrativo</h1>
      <nav aria-label="Administração" className="mt-5 flex flex-wrap gap-2">
        <Link className="botao-secundario" href="/admin">Visão geral</Link>
        <Link className="botao-secundario" href="/admin/artigos">Artigos</Link>
        {usuario.papel==="administrador"&&<><Link className="botao-secundario" href="/admin/usuarios">Usuários</Link><Link className="botao-secundario" href="/admin/auditoria">Auditoria</Link></>}
      </nav>
    </div>{children}</main>;
}
