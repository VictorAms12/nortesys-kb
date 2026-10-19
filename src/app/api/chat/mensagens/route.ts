import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {listarMensagens,ErroChat} from "../../../../lib/chat-banco";
import {CHAT_UUID} from "../../../../lib/chat-tipos";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Sessão expirada."},{status:401});
 const conversa=req.nextUrl.searchParams.get("conversa")??"";
 if(!CHAT_UUID.test(conversa))return NextResponse.json({erro:"Conversa inválida."},{status:400});
 const antesRaw=req.nextUrl.searchParams.get("antes")??"";
 const antes=/^[1-9]\d{0,17}$/.test(antesRaw)?Number(antesRaw):null;
 const pesquisa=(req.nextUrl.searchParams.get("q")??"").trim().slice(0,100);
 try {
   const mensagens=await listarMensagens(u.id,conversa,antes,pesquisa);
   return NextResponse.json({mensagens},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
   if(e instanceof ErroChat)return NextResponse.json({erro:e.message},{status:e.status});
   console.error("[chat] Falha mensagens",e instanceof Error?e.name:"erro");
   return NextResponse.json({erro:"Mensagens indisponíveis."},{status:503});
 }
}
