/** Placeholder sem dados nem mensagens de outros usuários. */
export default function CarregandoChat() {
 return <main id="conteudo" className="conteiner pagina-chat" role="status" aria-live="polite">
  <span className="sr-only">Carregando conversas da equipe...</span>
  <div className="chat-painel chat-skeleton" aria-hidden="true">
   <aside className="chat-skeleton-lista">
    <div className="skeleton skeleton-titulo"/>
    <div className="skeleton skeleton-linha"/>
    <div className="skeleton skeleton-linha"/>
    <div className="skeleton skeleton-linha skeleton-curto"/>
   </aside>
   <div className="chat-skeleton-area">
    <div className="skeleton skeleton-titulo"/>
    <div className="chat-skeleton-miolo"><div className="skeleton skeleton-linha"/><div className="skeleton skeleton-linha skeleton-curto"/></div>
    <div className="skeleton skeleton-pesquisa"/>
   </div>
  </div>
 </main>;
}
