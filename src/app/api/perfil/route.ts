import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../lib/sessao";
import {consultar} from "../../../lib/banco";
import {verificarOrigemPost} from "../../../lib/origem";
export async function GET(req:NextRequest){
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 const rows=await consultar<{bio:string|null;preferencias:unknown}>(
  "SELECT bio,preferencias_notificacoes AS preferencias FROM kb_usuarios WHERE id=$1",[u.id]);
 return NextResponse.json({nome:u.nome,usuario:u.usuario,papel:u.papel,...rows[0]},{headers:{"Cache-Control":"private, no-store"}});
}

export async function PATCH(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 try{
  const raw=await req.text();if(raw.length>1200)return NextResponse.json({erro:"Dados inválidos"},{status:413});
  const payload:unknown=JSON.parse(raw);
  if(!payload||typeof payload!=="object")return NextResponse.json({erro:"Dados inválidos"},{status:400});
  const {bio,preferencias}=payload as {bio?:unknown;preferencias?:unknown};
  if(typeof bio!=="string"||bio.length>240||!preferencias||typeof preferencias!=="object"||Array.isArray(preferencias))
   return NextResponse.json({erro:"Campos inválidos"},{status:400});
  const p=preferencias as Record<string,unknown>;
  if(["avisos","navegador","geral"].some(k=>typeof p[k]!=="boolean"))return NextResponse.json({erro:"Preferências inválidas"},{status:400});
  await consultar("UPDATE kb_usuarios SET bio=$2,preferencias_notificacoes=$3::jsonb,atualizado_em=NOW() WHERE id=$1",
   [u.id,bio.trim(),JSON.stringify({avisos:p.avisos,navegador:p.navegador,geral:p.geral})]);
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({erro:"Não foi possível salvar"},{status:503});}
}
