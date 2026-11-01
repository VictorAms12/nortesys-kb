import Link from "next/link";
import { exigirSessao } from "../../lib/autenticacao-servidor";
import { artigosDoUsuario } from "../../lib/interacoes";
import { hojeISO, resumoArtigo } from "../../lib/apresentacao";
import { CartaoArtigo } from "../../components/cartao-artigo";
export const dynamic="force-dynamic";
export default async function Pagina(){
 const u=await exigirSessao();const artigos=await artigosDoUsuario(u.id,u.papel,"recentes");
 return <main id="conteudo" className="conteiner py-9 sm:py-12"><nav className="trilha"><Link href="/">Início</Link><span>/</span><span>Acessados recentemente</span></nav>
 <h1 className="titulo-pagina">Acessados recentemente</h1><p className="mt-3 mb-7 texto-introducao">Artigos que você abriu por último.</p>
 {artigos.length?<div className="lista-artigos">{artigos.map(a=><CartaoArtigo key={a.url} artigo={resumoArtigo(a)} hoje={hojeISO()}/>)}</div>:<div className="estado-vazio">Nenhum artigo aqui ainda. <Link href="/artigos">Explorar artigos</Link></div>}
 </main>;
}
