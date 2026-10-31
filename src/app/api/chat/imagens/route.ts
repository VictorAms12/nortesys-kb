import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {del,put} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {TAMANHO_MAXIMO_IMAGEM,MIMES_IMAGEM} from "../../../../lib/imagens";
import {validarImagem,ErroImagem} from "../../../../lib/imagens-validacao";
import {CHAT_UUID} from "../../../../lib/chat-tipos";
import {reservarEnvioImagemChat,registrarImagemChat,ErroChat} from "../../../../lib/chat-banco";

export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",Vary:"Cookie"};
const LIMITE_FORMULARIO=TAMANHO_MAXIMO_IMAGEM+32768;
function erro(mensagem:string,status:number){
 return NextResponse.json({erro:mensagem},{status,headers});
}
/** Lê o multipart em tamanho limitado, mesmo com Content-Length ausente ou incorreto. */
async function formularioLimitado(req:NextRequest):Promise<FormData>{
 const declarado=req.headers.get("content-length");
 if(declarado!==null&&(!/^\d+$/.test(declarado)||Number(declarado)>LIMITE_FORMULARIO))
  throw new ErroImagem(413,"Imagem muito grande. Limite: 2 MB.");
 if(!req.body)throw new ErroImagem(400,"Selecione uma imagem.");
 const reader=req.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>LIMITE_FORMULARIO){await reader.cancel();throw new ErroImagem(413,"Imagem muito grande. Limite: 2 MB.");}
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 try{return await new Response(Buffer.concat(chunks),{headers:{"Content-Type":req.headers.get("content-type")??""}}).formData();}
 catch{throw new ErroImagem(400,"Formulário inválido.");}
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return erro("Origem inválida.",403);
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return erro("Sessão expirada.",401);
 if(!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;"))
  return erro("Envie um formulário com imagem.",415);
 try{
  const form=await formularioLimitado(req);
  const arquivo=form.get("imagem");
  if(!(arquivo instanceof File)||form.getAll("imagem").length!==1)
   return erro("Selecione uma única imagem.",400);
  if(!MIMES_IMAGEM.some(m=>m===arquivo.type))return erro("Use PNG, JPEG ou WebP.",415);
  const conversa=form.get("conversa");
  if(typeof conversa!=="string"||!CHAT_UUID.test(conversa))return erro("Conversa inválida.",400);
  const original=form.get("respondendoA");
  const resp=typeof original==="string"?original:"";
  if(resp!==""&&!/^[1-9]\d{0,14}$/.test(resp))return erro("Resposta inválida.",400);
  const respondendoA=resp===""?null:Number(resp);
  if(respondendoA!==null&&!Number.isSafeInteger(respondendoA))return erro("Resposta inválida.",400);
  const legenda=form.get("texto");
  if(legenda!==null&&typeof legenda!=="string")return erro("Legenda inválida.",400);
  const texto=(typeof legenda==="string"?legenda:"").trim();
  if(texto.length>2000)return erro("Legenda muito grande.",400);
  // Autoriza a conversa e debita a mesma cota de 15 mensagens/30 s antes do upload.
  await reservarEnvioImagemChat(usuario.id,conversa);
  const normal=await validarImagem(new Uint8Array(await arquivo.arrayBuffer()),arquivo.type);
  const caminho=`kb-chat-imagens/${randomUUID()}.${normal.extensao}`;
  let gravou=false;
  try{
   await put(caminho,Buffer.from(normal.bytes),{access:"private",contentType:normal.mime,
     addRandomSuffix:false,allowOverwrite:false,abortSignal:AbortSignal.timeout(30_000)});
   gravou=true;
   const mensagem=await registrarImagemChat(usuario.id,conversa,texto,respondendoA,caminho,normal.mime,normal.bytes.length);
   return NextResponse.json({mensagem},{status:201,headers});
  }catch(falha){
   if(gravou)try{await del(caminho,{abortSignal:AbortSignal.timeout(15_000)});}
   catch{console.error("[chat] Falha ao compensar imagem privada.");}
   throw falha;
  }
 }catch(falha){
  if(falha instanceof ErroImagem||falha instanceof ErroChat)return erro(falha.message,falha.status);
  console.error("[chat] Falha ao enviar imagem",falha instanceof Error?falha.name:"erro");
  const code=typeof falha==="object"&&falha!==null&&"code" in falha?falha.code:undefined;
  return erro(code==="42703"||code==="42P01"?"Migração 008 do chat ainda não aplicada.":"Não foi possível enviar a imagem.",503);
 }
}
