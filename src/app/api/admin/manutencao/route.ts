import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {executarManutencao} from "../../../../lib/manutencao";
import {registrarAuditoriaSegura} from "../../../../lib/auditoria-eventos";
export const runtime="nodejs";export const dynamic="force-dynamic";
function voltar(req:NextRequest,aviso:string){
 const url=new URL("/admin/manutencao",req.url);url.searchParams.set("aviso",aviso);
 return NextResponse.redirect(url,{status:303});
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return new NextResponse("Origem inválida.",{status:403});
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario||usuario.papel!=="administrador")return new NextResponse("Acesso negado.",{status:403});
 const declarado=req.headers.get("content-length");
 if(!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")||
 (declarado!==null&&(!/^\d+$/.test(declarado)||Number(declarado)>250)))
 return new NextResponse("Dados inválidos.",{status:400});
 try{
  const body=await req.text();if(body.length>250)return new NextResponse("Dados inválidos.",{status:400});
  const form=new URLSearchParams(body);
  if(form.get("acao")!=="executar")return new NextResponse("Ação inválida.",{status:400});
  const resultado=await executarManutencao();
  await registrarAuditoriaSegura(usuario.id,"chat_imagens_limpeza","manutencao");
  return voltar(req,resultado.falhas>0?"parcial":"concluida");
 }catch(e){
  console.error("[manutencao] Execução indisponível",e instanceof Error?e.name:"erro");
  return voltar(req,"falha");
 }
}
