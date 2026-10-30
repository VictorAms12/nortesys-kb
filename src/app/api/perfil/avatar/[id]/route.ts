import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {get} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../../lib/sessao";
import {consultar} from "../../../../../lib/banco";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!user)return new NextResponse(null,{status:401});
 const id=(await params).id;
 if(!/^[0-9a-f-]{36}$/.test(id))return new NextResponse(null,{status:404});
 try{
 const found=await consultar<{caminho:string}>("SELECT avatar_caminho AS caminho FROM kb_usuarios WHERE id=$1 AND ativo=true",[id]);
 const path=found[0]?.caminho;
 if(!path||!/^kb-perfis\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path))return new NextResponse(null,{status:404});
 const obj=await get(path,{access:"private",abortSignal:AbortSignal.timeout(15000)});
 if(!obj||obj.statusCode!==200)return new NextResponse(null,{status:404});
 if(!["image/png","image/jpeg","image/webp"].includes(obj.blob.contentType)){
  await obj.stream.cancel();return new NextResponse(null,{status:503});
 }
 return new Response(obj.stream,{headers:{"Content-Type":obj.blob.contentType,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin","Content-Disposition":"inline"}});
 }catch{return new NextResponse(null,{status:503});}
}
