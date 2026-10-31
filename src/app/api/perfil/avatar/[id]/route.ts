import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {get} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../../lib/sessao";
import {consultar} from "../../../../../lib/banco";

const privacidade={
 "Cache-Control":"private, max-age=300, must-revalidate",
 "Vary":"Cookie",
 "X-Content-Type-Options":"nosniff",
 "Cross-Origin-Resource-Policy":"same-origin",
};

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const user=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!user)return new NextResponse(null,{status:401});
 const id=(await params).id;
 if(!/^[0-9a-f-]{36}$/.test(id))return new NextResponse(null,{status:404});
 try{
  const found=await consultar<{caminho:string}>(`
   SELECT avatar_caminho AS caminho FROM kb_usuarios WHERE id=$1 AND ativo=true`,[id]);
  const path=found[0]?.caminho;
  if(!path||!/^kb-perfis\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path))
   return new NextResponse(null,{status:404});
  const etag='"'+createHash("sha256").update(path).digest("hex")+'"';
  if(req.headers.get("if-none-match")?.split(",").some(valor=>valor.trim()===etag))
   return new NextResponse(null,{status:304,headers:{...privacidade,ETag:etag}});
  const obj=await get(path,{access:"private",abortSignal:AbortSignal.timeout(15000)});
  if(!obj||obj.statusCode!==200)return new NextResponse(null,{status:404});
  if(!["image/png","image/jpeg","image/webp"].includes(obj.blob.contentType)){
   await obj.stream.cancel();return new NextResponse(null,{status:503});
  }
  return new Response(obj.stream,{headers:{
   ...privacidade,"Content-Type":obj.blob.contentType,"Content-Disposition":"inline",ETag:etag
  }});
 }catch{return new NextResponse(null,{status:503});}
}
