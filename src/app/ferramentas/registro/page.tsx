import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../../lib/autenticacao-servidor";
import {GeradorRegistro} from "../../../components/gerador-registro";
import {RastreadorAuditoria} from "../../../components/rastreador-auditoria";
export const metadata:Metadata={title:"Registro de atendimento | Nortesys KB"};
export default async function PaginaRegistro(){
  await exigirSessao();
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Registro de atendimento</span></nav>
    <div className="mb-8"><p className="sobre-titulo">Ferramenta para suporte</p>
      <h1 className="titulo-pagina mt-2">Gerador de registro técnico</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">Preencha os campos do atendimento e copie um registro organizado para o sistema de chamados.</p>
    </div>
    <RastreadorAuditoria evento="registro_aberto"/><GeradorRegistro/>
  </main>;
}
