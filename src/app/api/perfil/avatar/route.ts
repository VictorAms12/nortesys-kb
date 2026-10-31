import type {NextRequest} from "next/server";
import {NextResponse,after} from "next/server";
import {randomUUID} from "node:crypto";
import {put,del} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {consultar} from "../../../../lib/banco";
import {validarImagem,ErroImagem} from "../../../../lib/imagens-validacao";
const MAX=2*1024*1024+32768;
/** Lê multipart de forma limitada inclusive sem Content-Length, antes de montar FormData. */
async function lerMultipart(req:NextRequest):Promise<FormData>{
 const informado=req.headers.get("content-length");
 if(informado!==null&&(!/^[0-9]+$/.test(informado)||Number(informado)>MAX))
  throw new ErroImagem(413,"Imagem muito grande. Limite: 2 MB.");
 if(!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")||!req.body)
  throw new ErroImagem(415,"Envie uma imagem no formulário.");
 const reader=req.body.getReader();const buffers:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>MAX){await reader.cancel();throw new ErroImagem(413,"Imagem muito grande. Limite: 2 MB.");}
   buffers.push(value);
  }
 }finally{reader.releaseLock();}
 try{return await new Response(Buffer.concat(buffers),{headers:{"Content-Type":req.headers.get("content-type")??""}}).formData();}
 catch{throw new ErroImagem(400,"Formulário de imagem inválido.");}
}
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 const size=Number(req.headers.get("content-length")??0);
 if(!Number.isFinite(size)||size>MAX)return NextResponse.json({erro:"Imagem muito grande"},{status:413});
 try{
  const form=await lerMultipart(req);
  const file=form.get("imagem");
  if(!(file instanceof File)||form.getAll("imagem").length!==1||file.size>2*1024*1024)
   return NextResponse.json({erro:"Imagem inválida"},{status:400});
  const img=await validarImagem(new Uint8Array(await file.arrayBuffer()),file.type);
  const anterior=await consultar<{avatar_caminho:string|null}>("SELECT avatar_caminho FROM kb_usuarios WHERE id=$1",[u.id]);
  const caminho="kb-perfis/"+randomUUID()+"."+img.extensao;
  await put(caminho,Buffer.from(img.bytes),{access:"private",contentType:img.mime,addRandomSuffix:false,allowOverwrite:false,abortSignal:AbortSignal.timeout(30000)});
  try{
   const linhas=await consultar<{id:string}>("UPDATE kb_usuarios SET avatar_caminho=$2,atualizado_em=NOW() WHERE id=$1 RETURNING id",[u.id,caminho]);
   if(!linhas.length)throw Error("Conta indisponível");
  }catch(e){await del(caminho).catch(()=>{});throw e;}
  const antigo=anterior[0]?.avatar_caminho;
  if(antigo&&antigo!==caminho&&/^kb-perfis\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(antigo))
   after(async()=>{
    await del(antigo,{abortSignal:AbortSignal.timeout(15000)})
     .catch(()=>console.error("[perfil] Não foi possível limpar avatar anterior."));
   });
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  if(e instanceof ErroImagem)return NextResponse.json({erro:e.message},{status:e.status});
  return NextResponse.json({erro:"Não foi possível salvar sua foto"},{status:503});
 }
}
