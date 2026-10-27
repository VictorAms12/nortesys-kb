import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../lib/sessao";
import {verificarOrigemPost} from "../../../lib/origem";
import {consultar} from "../../../lib/banco";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function usuario(req:NextRequest){return obterSessao(req.cookies.get(NOME_COOKIE)?.value);}
export async function GET(req:NextRequest){
 const u=await usuario(req);if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 try{
 const itens=await consultar<{id:number;conversaId:string;autor:string;criadaEm:string;vistaEm:string|null;tipo:string}>(`SELECT n.id,n.conversa_id AS "conversaId",u.nome AS autor,n.criada_em::text AS "criadaEm",n.vista_em::text AS "vistaEm",c.tipo
 FROM kb_notificacoes n JOIN kb_usuarios u ON u.id=n.autor_id JOIN kb_chat_conversas c ON c.id=n.conversa_id
 WHERE n.destinatario_id=$1 AND n.criada_em>NOW()-INTERVAL '14 days'
 ORDER BY n.id DESC LIMIT 40`,[u.id]);
 return NextResponse.json({itens,naoLidas:itens.filter(x=>!x.vistaEm).length},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({itens:[],naoLidas:0,indisponivel:true},{headers:{"Cache-Control":"private, no-store"}});}
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await usuario(req);if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 try{
 const raw=await req.text();if(raw.length>250)return NextResponse.json({erro:"Dados inválidos"},{status:413});
 const d=JSON.parse(raw) as {ids?:number[];todas?:boolean};
 if(d.todas===true)await consultar("UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND vista_em IS NULL",[u.id]);
 else if(Array.isArray(d.ids)&&d.ids.length<=40&&d.ids.every(id=>Number.isSafeInteger(id)&&id>0))
 await consultar("UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND id=ANY($2::bigint[])",[u.id,d.ids]);
 else return NextResponse.json({erro:"Dados inválidos"},{status:400});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({erro:"Falha na atualização"},{status:503});}
}
