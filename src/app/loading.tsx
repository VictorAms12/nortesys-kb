/** Estado de carregamento apenas visual para navegação entre páginas do App Router. */
export default function CarregandoConteudo() {
 return <main id="conteudo" className="conteiner skeleton-pagina" role="status" aria-live="polite">
  <span className="sr-only">Carregando conteúdo da base de conhecimento...</span>
  <div className="skeleton skeleton-titulo" aria-hidden="true"/>
  <div className="skeleton skeleton-resumo" aria-hidden="true"/>
  <div className="skeleton skeleton-pesquisa" aria-hidden="true"/>
  <div className="skeleton skeleton-linha" aria-hidden="true"/>
  <div className="skeleton skeleton-linha skeleton-curto" aria-hidden="true"/>
  <div className="skeleton skeleton-linha" aria-hidden="true"/>
 </main>;
}
