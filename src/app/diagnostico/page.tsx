import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {carregarTodosArtigos} from "../../lib/artigos-banco";
import {criarIndiceBusca} from "../../lib/indice-busca";
import {DiagnosticoGuiado} from "../../components/diagnostico-guiado";
import {RastreadorAuditoria} from "../../components/rastreador-auditoria";
export const metadata:Metadata={title:"Diagnóstico guiado | Nortesys KB"};
export default async function PaginaDiagnostico(){
  const usuario=await exigirSessao();
  const documentos=criarIndiceBusca(await carregarTodosArtigos(usuario.papel));
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Diagnóstico</span></nav>
    <div className="mb-8">
      <h1 className="titulo-pagina">Diagnóstico guiado</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">Responda perguntas simples sobre o problema para encontrar procedimentos já disponíveis na base.</p>
    </div>
    <RastreadorAuditoria evento="diagnostico_aberto"/><DiagnosticoGuiado documentos={documentos}/>
  </main>;
}
