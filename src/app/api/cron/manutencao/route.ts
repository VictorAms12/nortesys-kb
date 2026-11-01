import {timingSafeEqual} from "node:crypto";
import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {executarManutencao} from "../../../../lib/manutencao";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function autorizado(req:NextRequest):boolean {
 const segredo=process.env.CRON_SECRET;
 const enviado=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"")??"";
 if(!segredo||segredo.length<24||!enviado)return false;
 const esperado=Buffer.from(segredo);
 const recebido=Buffer.from(enviado);
 return esperado.length===recebido.length&&timingSafeEqual(esperado,recebido);
}

export async function GET(req:NextRequest){
 if(!process.env.CRON_SECRET||process.env.CRON_SECRET.length<24)
  return NextResponse.json({erro:"Manutenção não configurada"},{status:503});
 if(!autorizado(req))
  return NextResponse.json({erro:"Não autorizado"},{status:401});
 try {
  const resultado=await executarManutencao();
  return NextResponse.json({ok:resultado.falhas===0,...resultado},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  console.error("[cron] Falha na manutenção",e instanceof Error?e.name:"erro");
  return NextResponse.json({erro:"Manutenção indisponível"},
   {status:503,headers:{"Cache-Control":"private, no-store"}});
 }
}
