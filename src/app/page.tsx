import Link from "next/link";
import { exigirSessao } from "../lib/autenticacao-servidor";
import { contarPorCategoria } from "../lib/artigos";
import { carregarTodosArtigos } from "../lib/artigos-banco";
import { artigoPrecisaRevisao, formatarData, hojeISO, resumoArtigo } from "../lib/apresentacao";
import { CartaoArtigo } from "../components/cartao-artigo";
import { IconeInterface } from "../components/icone-interface";

export default async function Home() {
 const sessao=await exigirSessao();
 const artigos=await carregarTodosArtigos(sessao.papel);
 const categorias=contarPorCategoria(artigos);
 const hoje=hojeISO();
 const revisao=artigos.filter(a=>artigoPrecisaRevisao(a,hoje)||a.status==="obsoleto");
 const recentes=[...artigos].sort((a,b)=>b.atualizadoEm.localeCompare(a.atualizadoEm)).slice(0,8);
 const codigos=[...new Set(artigos.flatMap(a=>a.codigosErro??[]))].slice(0,4);
 const ultimaAtualizacao=artigos.reduce((data,a)=>a.atualizadoEm>data?a.atualizadoEm:data,"");
 return <main id="conteudo" className="conteiner pagina-inicio">
  <header className="cabecalho-pagina">
   <div><h1 className="titulo-pagina">Base de conhecimento</h1>
    <p className="texto-introducao">Procedimentos técnicos, códigos de erro e orientações para o suporte Nortesys.</p></div>
   <div className="metadados-linha"><span>{artigos.length} artigos</span><span aria-hidden="true">·</span><span>{categorias.length} categorias</span>{ultimaAtualizacao&&<><span aria-hidden="true">·</span><time dateTime={ultimaAtualizacao}>Atualizada em {formatarData(ultimaAtualizacao)}</time></>}</div>
  </header>
  <section className="pesquisa-inicio" aria-label="Pesquisar procedimentos">
   <form action="/busca" role="search" className="pesquisa-inicio-form">
    <IconeInterface nome="busca" width={18} height={18}/>
    <label className="sr-only" htmlFor="busca-inicio">Buscar por erro, código ou procedimento</label>
    <input id="busca-inicio" name="q" type="search" maxLength={120} placeholder="Buscar por erro, código ou procedimento" autoComplete="off"/>
    <kbd className="atalho-teclado atalho-inicio" title="Atalho para a busca global">/</kbd>
    <button type="submit" className="botao-primario">Buscar</button>
   </form>
   <div className="pesquisa-exemplos"><span>Consultas rápidas</span>
    {(codigos.length?codigos:["NF-e","NFC-e","CFOP"]).map(codigo=><Link key={codigo} href={"/busca?q="+encodeURIComponent(codigo)}><code>{codigo}</code></Link>)}
   </div>
  </section>
  <div className="grid-painel-inicio">
   <section className="painel-lista painel-lista-recentes" aria-labelledby="titulo-recentes">
    <div className="cabecalho-lista"><h2 id="titulo-recentes">Artigos recentes</h2><Link href="/recentes">Ver todos</Link></div>
    {recentes.length?<div className="lista-artigos lista-artigos-recentes">{recentes.map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>)}</div>:
    <p className="estado-vazio" role="status">Nenhum artigo disponível na base.</p>}
   </section>
   <div className="pilha-paineis">
    <section className="painel-lista painel-lista-apoio" aria-labelledby="titulo-revisoes">
     <div className="cabecalho-lista"><h2 id="titulo-revisoes">Precisam de revisão</h2><span className="contagem-discreta">{revisao.length}</span></div>
     {revisao.length?<div className="lista-artigos">{revisao.slice(0,4).map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hoje}/>)}</div>:
     <p className="estado-vazio" role="status">Nenhum artigo com revisão pendente.</p>}
    </section>
    <section className="painel-lista painel-lista-apoio" aria-labelledby="titulo-categorias">
     <div className="cabecalho-lista"><h2 id="titulo-categorias">Categorias</h2><Link href="/categorias">Ver todas</Link></div>
     {categorias.length?<div className="categorias-resumidas">{categorias.map(c=><Link href={"/categorias/"+c.slug} key={c.slug}>
      <span>{c.nome}</span><span className="contagem-discreta">{c.quantidade}</span>
     </Link>)}</div>:<p className="estado-vazio" role="status">Nenhuma categoria disponível.</p>}
    </section>
   </div>
  </div>
 </main>;
}
