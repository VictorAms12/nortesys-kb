import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {ChatPainel} from "../../components/chat-painel";
import {RastreadorAuditoria} from "../../components/rastreador-auditoria";
export const metadata:Metadata={title:"Chat da equipe | Nortesys KB"};
export const dynamic="force-dynamic";
export default async function PaginaChat(){
 const usuario=await exigirSessao();
 return <main id="conteudo" className="conteiner py-9 sm:py-12">
  <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Chat</span></nav>
  <div className="mb-6"><p className="sobre-titulo">Comunicação da equipe</p>
    <h1 className="titulo-pagina mt-2">Chat interno</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">Converse com colegas, compartilhe artigos e acompanhe a disponibilidade da equipe. Histórico e mensagens privadas exigem login.</p>
  </div>
  <RastreadorAuditoria evento="chat_aberto"/>
  <ChatPainel usuarioId={usuario.id}/>
 </main>;
}
