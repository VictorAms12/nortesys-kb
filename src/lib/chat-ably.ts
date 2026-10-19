import "server-only";
import {randomUUID} from "node:crypto";
const BASE="https://main.realtime.ably.net";
function credencial(){
  const chave=process.env.ABLY_API_KEY?.trim()??"";
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(chave))return null;
  return {chave,nome:chave.split(":")[0]};
}
export function ablyConfigurado():boolean{return Boolean(credencial());}
function cabecalhos(chave:string){
  return {Authorization:"Basic "+Buffer.from(chave).toString("base64"),
    "Content-Type":"application/json",Accept:"application/json"};
}
/** Todo evento leva somente IDs; o conteúdo privado permanece no Neon. */
export async function publicarChat(canal:string,evento:"mensagem"|"digitando"|"alteracao",dados:Record<string,string|number>):Promise<boolean>{
  const c=credencial();if(!c)return false;
  try{
    const resposta=await fetch(BASE+"/channels/"+encodeURIComponent(canal)+"/messages",{
      method:"POST",headers:cabecalhos(c.chave),
      body:JSON.stringify({name:"chat_"+evento,data:dados}),
      signal:AbortSignal.timeout(5000),cache:"no-store"});
    if(!resposta.ok)console.error("[chat] Publicação Ably",resposta.status);
    return resposta.ok;
  }catch(e){console.error("[chat] Ably indisponível",e instanceof Error?e.name:"erro");return false;}
}
/** Token de subscribe somente para canal geral e pessoal do usuário autenticado. */
export async function tokenRealtime(usuarioId:string):Promise<{token:string;expires:number;channels:string[]} | null>{
  const c=credencial();if(!c)return null;
  const canais=["kb-chat:geral","kb-chat:usuario:"+usuarioId];
  const capability=Object.fromEntries(canais.map(canal=>[canal,["subscribe"]]));
  const req={keyName:c.nome,clientId:usuarioId,timestamp:Date.now(),nonce:randomUUID().replaceAll("-",""),
    ttl:30*60*1000,capability:JSON.stringify(capability)};
  const res=await fetch(BASE+"/keys/"+encodeURIComponent(c.nome)+"/requestToken",{
    method:"POST",headers:cabecalhos(c.chave),body:JSON.stringify(req),cache:"no-store",
    signal:AbortSignal.timeout(8000)});
  if(!res.ok){console.error("[chat] Falha token Ably",res.status);return null;}
  const dados=await res.json() as {token?:string;expires?:number;capability?:string};
  if(!dados.token||!dados.expires) return null;
  // Falhar fechado quando a chave não conceder os dois canais previstos.
  let permissoes:Record<string,string[]>;
  try {permissoes=JSON.parse(dados.capability??"{}") as Record<string,string[]>;}catch{return null;}
  if(!canais.every(canal=>permissoes[canal]?.includes("subscribe")))return null;
  return {token:dados.token,expires:dados.expires,channels:canais};
}
