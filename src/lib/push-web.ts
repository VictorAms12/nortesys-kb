import "server-only";
import {createECDH,createHash,createPrivateKey,sign} from "node:crypto";
import {consultar} from "./banco";
type Chave={publica:string;privada:string;chave:ReturnType<typeof createPrivateKey>};
function chave():Chave|null{
 const publica=process.env.WEB_PUSH_PUBLIC_KEY??"";
 const privada=process.env.WEB_PUSH_PRIVATE_KEY??"";
 if(!/^[A-Za-z0-9_-]+$/.test(publica)||!/^[A-Za-z0-9_-]+$/.test(privada))return null;
 try{
  const pub=Buffer.from(publica,"base64url"),secret=Buffer.from(privada,"base64url");
  if(pub.length!==65||pub[0]!==4||secret.length!==32)return null;
  const ecdh=createECDH("prime256v1");ecdh.setPrivateKey(secret);
  if(!ecdh.getPublicKey().equals(pub))return null;
  return {publica,privada,chave:createPrivateKey({key:{kty:"EC",crv:"P-256",
   x:pub.subarray(1,33).toString("base64url"),y:pub.subarray(33,65).toString("base64url"),
   d:privada},format:"jwk"})};
 }catch{return null;}
}
export function webPushDisponivel(){return chave()!==null;}
export function chavePublicaPush(){return chave()?.publica??null;}
export function endpointPushValido(valor:unknown):valor is string{
 if(typeof valor!=="string"||valor.length<50||valor.length>2000)return false;
 try{
  const url=new URL(valor);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash)return false;
  const host=url.hostname.toLowerCase();
  return ["fcm.googleapis.com","updates.push.services.mozilla.com","push.services.mozilla.com","web.push.apple.com"].includes(host)
   ||host.endsWith(".push.apple.com")
   ||host.endsWith(".notify.windows.com");
 }catch{return false;}
}
export function hashEndpoint(endpoint:string){return createHash("sha256").update(endpoint).digest("hex");}
function tokenVapid(origin:string,cred:Chave){
 const header=Buffer.from(JSON.stringify({alg:"ES256",typ:"JWT"})).toString("base64url");
 const payload=Buffer.from(JSON.stringify({aud:origin,exp:Math.floor(Date.now()/1000)+1800,sub:"https://nortesys-kb.vercel.app"})).toString("base64url");
 const body=header+"."+payload;
 const signature=sign("SHA256",Buffer.from(body),{key:cred.chave,dsaEncoding:"ieee-p1363"}).toString("base64url");
 return body+"."+signature;
}
/** Web Push sem payload: jamais transmite texto, autor ou ID privado ao intermediário. */
export async function enviarPushChat(autor:string,conversa:string):Promise<void>{
 const cred=chave();if(!cred)return;
 try{
  const subs=await consultar<{endpoint:string}>(`SELECT s.endpoint FROM kb_push_subscricoes s
 JOIN kb_chat_participantes p ON p.usuario_id=s.usuario_id AND p.conversa_id=$2
 JOIN kb_chat_conversas c ON c.id=$2
 JOIN kb_usuarios u ON u.id=s.usuario_id AND u.ativo=true
 WHERE s.usuario_id<>$1 AND p.silenciada=FALSE AND u.preferencias_notificacoes->>'navegador'='true'
 AND (c.tipo<>'geral' OR u.preferencias_notificacoes->>'geral'='true')
 ORDER BY s.criado_em DESC LIMIT 50`,[autor,conversa]);
  await Promise.allSettled(subs.filter(x=>endpointPushValido(x.endpoint)).map(async({endpoint})=>{
   const aud=new URL(endpoint).origin;
   const jwt=tokenVapid(aud,cred);
   const result=await fetch(endpoint,{method:"POST",redirect:"error",
    headers:{"Authorization":"vapid t="+jwt+", k="+cred.publica,"TTL":"90","Content-Length":"0"},
    signal:AbortSignal.timeout(2500)});
   if(result.status===404||result.status===410)
    await consultar("DELETE FROM kb_push_subscricoes WHERE endpoint_hash=$1",[hashEndpoint(endpoint)]);
  }));
 }catch{/* Notificação nunca bloqueia a mensagem persistida. */}
}
