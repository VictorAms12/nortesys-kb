import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {tokenRealtime} from "../../../../lib/chat-ably";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado."},{status:401});
 try {
   const token=await tokenRealtime(u.id);
   if(!token)return NextResponse.json({erro:"Serviço em tempo real não configurado ou permissão de canal insuficiente."},{status:503});
   return NextResponse.json(token,{headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
 }catch(e){
   console.error("[chat] Falha na emissão de token",e instanceof Error?e.name:"erro");
   return NextResponse.json({erro:"Não foi possível conectar ao serviço de tempo real."},{status:503});
 }
}
