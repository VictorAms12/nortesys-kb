import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {carregarTodosArtigos} from "../../lib/artigos-banco";
import {criarIndiceBusca} from "../../lib/indice-busca";
import {DiagnosticoGuiado} from "../../components/diagnostico-guiado";
export const metadata:Metadata={title:"Diagnóstico guiado | Nortesys KB"};
export default async function PaginaDiagnostico(){
  const usuario=await exigirSessao();
  const documentos=criarIndiceBusca(await carregarTodosArtigos(usuario.papel));
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Diagnóstico</span></nav>
    <div className="mb-8"><p className="sobre-titulo">Triagem orientada</p>
      <h1 className="titulo-pagina mt-2">Diagnóstico guiado</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">Responda perguntas simples sobre o problema para encontrar procedimentos já disponíveis na base.</p>
    </div>
    <DiagnosticoGuiado documentos={documentos}/>
  </main>;
}
