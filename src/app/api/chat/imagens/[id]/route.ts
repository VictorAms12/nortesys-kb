import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {get} from "@vercel/blob";
import {consultar} from "../../../../../lib/banco";
import {NOME_COOKIE,obterSessao} from "../../../../../lib/sessao";
import {SQL_LER_IMAGEM_CHAT} from "../../../../../lib/chat-sql";
export const runtime="nodejs";export const dynamic="force-dynamic";
type ImagemLinha={imagem_caminho:string;imagem_mime:string;imagem_tamanho:number};
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff",
 Vary:"Cookie","Cross-Origin-Resource-Policy":"same-origin"};
function erro(mensagem:string,status:number){
 return NextResponse.json({erro:mensagem},{status,headers});
}
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return erro("Sessão expirada.",401);
 const id=(await params).id;
 if(!/^[1-9]\d{0,14}$/.test(id)||!Number.isSafeInteger(Number(id)))return erro("Imagem não encontrada.",404);
 try{
  const rows=await consultar<ImagemLinha>(SQL_LER_IMAGEM_CHAT,[usuario.id,Number(id)]);
  const imagem=rows[0];
  if(!imagem)return erro("Imagem não encontrada.",404);
  if(!/^kb-chat-imagens\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(imagem.imagem_caminho)||
   !["image/png","image/jpeg","image/webp"].includes(imagem.imagem_mime)||
   imagem.imagem_tamanho<1||imagem.imagem_tamanho>2097152)return erro("Imagem indisponível.",503);
  const blob=await get(imagem.imagem_caminho,{access:"private",abortSignal:AbortSignal.timeout(30_000)});
  if(!blob||blob.statusCode!==200)return erro("Imagem não encontrada.",404);
  if(blob.blob.contentType!==imagem.imagem_mime||blob.blob.size!==imagem.imagem_tamanho){
   await blob.stream.cancel();
   return erro("Imagem indisponível.",503);
  }
  return new Response(blob.stream,{headers:{...headers,"Content-Type":imagem.imagem_mime,
   "Content-Length":String(imagem.imagem_tamanho),"Content-Disposition":"inline"}});
 }catch(e){
  console.error("[chat] Falha na leitura privada da imagem",e instanceof Error?e.name:"erro");
  return erro("Imagem indisponível.",503);
 }
}
