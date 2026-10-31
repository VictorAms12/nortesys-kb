import type {Metadata} from "next";
import Link from "next/link";
import {exigirSessao} from "../../lib/autenticacao-servidor";
import {carregarTodosArtigos} from "../../lib/artigos-banco";
import {contarPorCategoria} from "../../lib/artigos";
import {IconeInterface,type NomeIcone} from "../../components/icone-interface";
export const metadata:Metadata={title:"Categorias | Nortesys KB"};
export default async function PaginaCategorias(){
 const sessao=await exigirSessao();
 const categorias=contarPorCategoria(await carregarTodosArtigos(sessao.papel));
 return <main id="conteudo" className="conteiner py-8">
  <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span aria-hidden="true">/</span><span>Categorias</span></nav>
  <header className="cabecalho-pagina"><div><h1 className="titulo-pagina">Categorias</h1><p className="texto-introducao">Artigos agrupados por área de atendimento.</p></div></header>
  <div className="lista-categorias">{categorias.map(c=><Link href={"/categorias/"+c.slug} key={c.slug} className="categoria-linha">
   <IconeInterface nome={c.icone as NomeIcone} className="text-[var(--muted)]"/>
   <span><strong>{c.nome}</strong><small>{c.descricao}</small></span>
   <span className="contagem-discreta">{c.quantidade} {c.quantidade===1?"artigo":"artigos"}</span>
  </Link>)}</div>
 </main>;
}
