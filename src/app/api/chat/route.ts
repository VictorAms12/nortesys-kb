import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../lib/sessao";
import {verificarOrigemPost} from "../../../lib/origem";
import {ablyConfigurado} from "../../../lib/chat-ably";
import {estadoChat,abrirConversaPrivada,enviarMensagem,marcarLida,atualizarPresenca,avisarDigitando,apagarMensagemParaMim,apagarMensagemParaTodos,limparConversaParaMim,definirSilencio,ErroChat} from "../../../lib/chat-banco";
import {CHAT_UUID} from "../../../lib/chat-tipos";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
function erro(mensagem:string,status:number){return NextResponse.json({erro:mensagem},{status,headers});}
async function autenticado(req:NextRequest){
 return obterSessao(req.cookies.get(NOME_COOKIE)?.value);
}
export async function GET(req:NextRequest){
 try {
  const u=await autenticado(req);if(!u)return erro("Sessão expirada.",401);
  return NextResponse.json(await estadoChat(u.id,ablyConfigurado()),{headers});
 }catch(e){console.error("[chat] Erro estado",e instanceof Error?e.name:"erro");return erro("Chat indisponível. Verifique a migração 006.",503);}
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return erro("Origem inválida.",403);
 const u=await autenticado(req);if(!u)return erro("Sessão expirada.",401);
 if(!req.headers.get("content-type")?.includes("application/json"))return erro("Envie JSON.",415);
 const tamanho=Number(req.headers.get("content-length")??0);
 if(!Number.isFinite(tamanho)||tamanho>6000)return erro("Conteúdo muito grande.",413);
 let b:unknown;try{
  const s=await req.text();if(s.length>6000)return erro("Conteúdo muito grande.",413);
  b=JSON.parse(s);
 }catch{return erro("JSON inválido.",400);}
 if(!b||typeof b!=="object")return erro("Dados inválidos.",400);
 const dados=b as Record<string,unknown>;
 try{
  switch(dados.acao){
   case "privada":{
     if(typeof dados.alvo!=="string"||!CHAT_UUID.test(dados.alvo))return erro("Colaborador inválido.",400);
     const id=await abrirConversaPrivada(u.id,dados.alvo);
     return NextResponse.json({id},{headers});
   }
   case "enviar":{
     if(typeof dados.conversa!=="string"||typeof dados.texto!=="string")return erro("Dados inválidos.",400);
     if(dados.respondendoA!==undefined&&dados.respondendoA!==null&&
        (typeof dados.respondendoA!=="number"||!Number.isSafeInteger(dados.respondendoA)||dados.respondendoA<=0))
        return erro("Mensagem de origem inválida.",400);
     const mensagem=await enviarMensagem(u.id,dados.conversa,dados.texto,(dados.respondendoA as number|null|undefined)??null);
     return NextResponse.json({mensagem},{status:201,headers});
   }
   case "apagar_mim":{
     if(typeof dados.conversa!=="string"||!Number.isSafeInteger(dados.mensagemId))
       return erro("Mensagem inválida.",400);
     await apagarMensagemParaMim(u.id,dados.conversa,dados.mensagemId as number);
     return NextResponse.json({ok:true},{headers});
   }
   case "apagar_todos":{
     if(typeof dados.conversa!=="string"||!Number.isSafeInteger(dados.mensagemId))
       return erro("Mensagem inválida.",400);
     await apagarMensagemParaTodos(u.id,dados.conversa,dados.mensagemId as number);
     return NextResponse.json({ok:true},{headers});
   }
   case "limpar":{
     if(typeof dados.conversa!=="string")return erro("Conversa inválida.",400);
     await limparConversaParaMim(u.id,dados.conversa);
     return NextResponse.json({ok:true},{headers});
   }
   case "silenciar":{
     if(typeof dados.conversa!=="string"||typeof dados.silenciada!=="boolean")
       return erro("Dados inválidos.",400);
     await definirSilencio(u.id,dados.conversa,dados.silenciada);
     return NextResponse.json({ok:true},{headers});
   }
   case "lido":{
     if(typeof dados.conversa!=="string"||typeof dados.ateId!=="number"||
       !Number.isSafeInteger(dados.ateId)||dados.ateId<=0)
       return erro("Leitura inválida.",400);
     await marcarLida(u.id,dados.conversa,dados.ateId);
     return NextResponse.json({ok:true},{headers});
   }
   case "presenca":{
     if(typeof dados.ativo!=="boolean")return erro("Estado inválido.",400);
     await atualizarPresenca(u.id,dados.ativo);return NextResponse.json({ok:true},{headers});
   }
   case "digitando":{
     if(typeof dados.conversa!=="string")return erro("Conversa inválida.",400);
     await avisarDigitando(u.id,dados.conversa);return NextResponse.json({ok:true},{headers});
   }
   default:return erro("Operação inválida.",400);
  }
 }catch(e){
   if(e instanceof ErroChat)return erro(e.message,e.status);
   console.error("[chat] Falha operação",typeof dados.acao==="string"?dados.acao:"desconhecida",e instanceof Error?e.name:"erro");
   return erro("Não foi possível completar a operação. Verifique a migração 006.",503);
 }
}
