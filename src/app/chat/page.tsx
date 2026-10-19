import type {Metadata} from "next";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {ChatPainel} from "../../components/chat-painel";
import {RastreadorAuditoria} from "../../components/rastreador-auditoria";
export const metadata:Metadata={title:"Chat da equipe | Nortesys KB"};
export const dynamic="force-dynamic";
export default async function PaginaChat(){
 const usuario=await exigirSessao();
 return <main id="conteudo" className="pagina-chat conteiner" aria-label="Chat da equipe">
  <h1 className="sr-only">Chat interno</h1>
  <RastreadorAuditoria evento="chat_aberto"/>
  <ChatPainel usuarioId={usuario.id}/>
 </main>;
}
