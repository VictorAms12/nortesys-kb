import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {ChatPainel} from "../../components/chat-painel";
import {RastreadorAuditoria} from "../../components/rastreador-auditoria";
export const metadata:Metadata={title:"Chat da equipe | Nortesys KB"};
export const dynamic="force-dynamic";
export default async function PaginaChat(){
 const usuario=await exigirSessao();
 return <main id="conteudo" className="pagina-chat conteiner">
  <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Chat</span></nav>
  <div className="chat-intro">
    <h1 className="titulo-secao">Chat interno</h1>
    <p className="chat-subtitulo text-sm text-[var(--muted)]">Converse com a equipe e compartilhe artigos da base de conhecimento.</p>
  </div>
  <RastreadorAuditoria evento="chat_aberto"/>
  <ChatPainel usuarioId={usuario.id}/>
 </main>;
}
