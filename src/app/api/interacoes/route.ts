import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { NOME_COOKIE, obterSessao } from "../../../lib/sessao";
import { verificarOrigemPost } from "../../../lib/origem";
import { alterarFavorito, registrarLeitura, urlArtigoValida } from "../../../lib/interacoes";
import { carregarTodosArtigos } from "../../../lib/artigos-banco";
import { registrarAuditoriaSegura } from "../../../lib/auditoria-eventos";
import { ErroFormularioLimitado, lerFormularioUrlEncodedLimitado } from "../../../lib/formulario-limitado";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
  if(!verificarOrigemPost(req.headers).valida) return new NextResponse("Origem inválida",{status:403});
  const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
  if(!usuario)return new NextResponse("Sessão expirada",{status:401});
  if(!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded"))return new NextResponse("Requisição inválida",{status:400});
  try{
    const form=await lerFormularioUrlEncodedLimitado(req,1200); const acao=form.get("acao");const url=form.get("artigo_url");
    if(!urlArtigoValida(url)||!["visita","favoritar","desfavoritar"].includes(String(acao)))return new NextResponse("Dados inválidos",{status:400});
    // Uma URL sintaticamente válida não basta: o artigo precisa existir e estar visível para o perfil.
    const visivel=(await carregarTodosArtigos(usuario.papel)).some(a=>a.url===url);
    if(!visivel)return new NextResponse("Artigo indisponível",{status:404});
    if(acao==="visita") await registrarLeitura(usuario.id,url);
    else await alterarFavorito(usuario.id,url,acao==="favoritar");
    await registrarAuditoriaSegura(usuario.id,acao==="visita"?"artigo_visualizado":acao==="favoritar"?"artigo_favoritado":"artigo_desfavoritado",url,{limitarMinutos:acao==="visita"?30:0});
    return NextResponse.json({ok:true, favorito:acao==="favoritar"});
  }catch(e){
    if(e instanceof ErroFormularioLimitado)return new NextResponse("Requisição inválida",{status:400});
    return new NextResponse("Não foi possível registrar a ação",{status:500});
  }
}
