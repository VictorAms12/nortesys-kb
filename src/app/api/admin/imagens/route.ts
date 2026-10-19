import type {NextRequest} from "next/server";
import {rotasImagens} from "../../../../lib/imagens-servidor";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {registrarAuditoriaSegura} from "../../../../lib/auditoria-eventos";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const res=await rotasImagens.enviar(req);
 if(res.status===201){
  try{
   const dados=await res.clone().json() as {id?:string};
   const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
   if(usuario&&dados.id)await registrarAuditoriaSegura(usuario.id,"imagem_enviada",dados.id);
  }catch(e){console.error("[auditoria] Imagem sem evento",e instanceof Error?e.name:"erro");}
 }
 return res;
}
