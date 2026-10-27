import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {consultar} from "../../../../lib/banco";
import {chavePublicaPush,endpointPushValido,hashEndpoint} from "../../../../lib/push-web";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 return NextResponse.json({publicKey:chavePublicaPush(),configurado:Boolean(chavePublicaPush())},
 {headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 if(!chavePublicaPush())return NextResponse.json({erro:"Web Push não configurado"},{status:503});
 try{
  const raw=await req.text();if(raw.length>2400)return NextResponse.json({erro:"Dados inválidos"},{status:413});
  const {endpoint}=JSON.parse(raw) as {endpoint?:unknown};
  if(!endpointPushValido(endpoint))return NextResponse.json({erro:"Serviço de push não aceito"},{status:400});
  await consultar(`INSERT INTO kb_push_subscricoes(usuario_id,endpoint_hash,endpoint) VALUES($1,$2,$3)
  ON CONFLICT(usuario_id,endpoint_hash) DO UPDATE SET endpoint=EXCLUDED.endpoint,criado_em=NOW()`,
  [u.id,hashEndpoint(endpoint),endpoint]);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({erro:"Falha ao registrar dispositivo"},{status:503});}
}
