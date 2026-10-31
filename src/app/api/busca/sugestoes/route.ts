import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {carregarTodosArtigos} from "../../../../lib/artigos-banco";
import {contarPorCategoria} from "../../../../lib/artigos";
import {criarIndiceBusca} from "../../../../lib/indice-busca";
import {criarBuscador,executarBusca} from "../../../../lib/busca";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET(req:NextRequest){
 const sessao=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!sessao)return NextResponse.json({erro:"Não autorizado"},{status:401,headers});
 const q=req.nextUrl.searchParams.get("q")?.trim()??"";
 if(q.length>120)return NextResponse.json({erro:"Consulta muito longa"},{status:400,headers});
 try{
  const artigos=await carregarTodosArtigos(sessao.papel);
  const categorias=contarPorCategoria(artigos).map(c=>({slug:c.slug,quantidade:c.quantidade}));
  const atualizadoEm=artigos.reduce((valor,a)=>a.atualizadoEm>valor?a.atualizadoEm:valor,"");
  if(q.length<2)return NextResponse.json({resultados:[],categorias,atualizadoEm},{headers});
  const indice=criarIndiceBusca(artigos);
  const resultados=executarBusca(criarBuscador(indice),q).slice(0,6).map(({artigo})=>({
   url:artigo.url,titulo:artigo.titulo,categoria:artigo.nomeCategoria,codigos:artigo.codigosErro?.slice(0,2)??[]
  }));
  return NextResponse.json({resultados},{headers});
 }catch{return NextResponse.json({erro:"Busca temporariamente indisponível"},{status:503,headers});}
}
