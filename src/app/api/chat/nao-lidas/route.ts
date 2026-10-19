import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {consultar} from "../../../../lib/banco";
import {garantirGeral} from "../../../../lib/chat-banco";
import {SQL_TOTAL_NAO_LIDAS} from "../../../../lib/chat-sql";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return NextResponse.json({erro:"Sessão expirada"},{status:401});
 try{
   await garantirGeral(usuario.id);
   const linhas=await consultar<{total:number}>(SQL_TOTAL_NAO_LIDAS,[usuario.id]);
   return NextResponse.json({total:linhas[0]?.total??0},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
   console.error("[chat] Falha contador",e instanceof Error?e.name:"erro");
   return NextResponse.json({erro:"Chat indisponível"},{status:503});
 }
}
