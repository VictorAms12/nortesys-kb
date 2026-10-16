import type { Metadata } from "next";
import Link from "next/link";
import { exigirSessao } from "../../lib/autenticacao-servidor";
import { carregarTodosArtigos } from "../../lib/artigos-banco";
import { hojeISO, resumoArtigo } from "../../lib/apresentacao";
import { FiltrosCategoria } from "../../components/filtros-categoria";
export const metadata: Metadata = {title:"Todos os artigos | Nortesys KB"};
export default async function TodosArtigos(){
  const sessao=await exigirSessao();
  const artigos=await carregarTodosArtigos(sessao.papel);
  return <main id="conteudo" className="conteiner py-9 sm:py-12">
    <nav className="trilha" aria-label="Caminho de navegação"><Link href="/">Início</Link><span>/</span><span>Artigos</span></nav>
    <div className="cabecalho-pagina"><div><p className="sobre-titulo">Biblioteca técnica</p><h1 className="titulo-pagina mt-2">Todos os artigos</h1><p className="mt-3 texto-introducao">Consulte procedimentos publicados e, conforme seu perfil, conteúdos em revisão. Filtre por sistema, tag, nível ou status.</p></div><Link className="botao-secundario" href="/busca">Buscar por código de erro →</Link></div>
    <FiltrosCategoria artigos={artigos.map(resumoArtigo)} hoje={hojeISO()}/>
  </main>;
}
