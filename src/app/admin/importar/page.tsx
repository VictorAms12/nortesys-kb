import type {Metadata} from "next";
import Link from "next/link";
import {exigirPapel} from "../../../lib/autenticacao-servidor";
import {ImportadorDocumento} from "../../../components/importador-documento";
export const metadata:Metadata={title:"Importar documento | Nortesys KB"};
export default async function PaginaImportar(){
  await exigirPapel(["administrador","editor"]);
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/admin">Administração</Link><span>/</span><span>Importar conteúdo</span></nav>
    <div className="mb-8"><p className="sobre-titulo">Importação assistida</p>
      <h1 className="titulo-pagina mt-2">Preparar artigo a partir de documento</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">Transforme um texto existente em um rascunho estruturado. A ferramenta não extrai automaticamente arquivos PDF nem determina se uma orientação está correta.</p>
    </div>
    <ImportadorDocumento/>
  </main>;
}
