import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../lib/sessao";
import {verificarOrigemPost} from "../../../lib/origem";
import {consultar} from "../../../lib/banco";
import {ErroFormularioLimitado,lerTextoLimitado} from "../../../lib/formulario-limitado";
import {SQL_LISTAR_NOTIFICACOES,SQL_CONTAR_NOTIFICACOES,SQL_MARCAR_NOTIFICACOES,SQL_MARCAR_TODAS_NOTIFICACOES,NOTIFICACAO_ID} from "../../../lib/notificacoes-sql";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function usuario(req:NextRequest){return obterSessao(req.cookies.get(NOME_COOKIE)?.value);}
export async function GET(req:NextRequest){
 const u=await usuario(req);if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 try{
 const [itens,total]=await Promise.all([
  consultar<{id:string;conversaId:string;autor:string;criadaEm:string;vistaEm:string|null;tipo:string}>(SQL_LISTAR_NOTIFICACOES,[u.id]),
  consultar<{total:number}>(SQL_CONTAR_NOTIFICACOES,[u.id])
 ]);
 return NextResponse.json({itens,naoLidas:total[0]?.total??0},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({itens:[],naoLidas:0,indisponivel:true},{headers:{"Cache-Control":"private, no-store"}});}
}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await usuario(req);if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 try{
 const raw=await lerTextoLimitado(req,250,"Dados inválidos");
 const d=JSON.parse(raw) as {ids?:string[];todas?:boolean};
 if(d.todas===true)await consultar(SQL_MARCAR_TODAS_NOTIFICACOES,[u.id]);
 else if(Array.isArray(d.ids)&&d.ids.length>0&&d.ids.length<=40&&d.ids.every(id=>typeof id==="string"&&NOTIFICACAO_ID.test(id)))
 await consultar(SQL_MARCAR_NOTIFICACOES,[u.id,d.ids]);
 else return NextResponse.json({erro:"Dados inválidos"},{status:400});
 return NextResponse.json({ok:true});
 }catch(e){
  if(e instanceof ErroFormularioLimitado)return NextResponse.json({erro:"Dados inválidos"},{status:e.status});
  return NextResponse.json({erro:"Falha na atualização"},{status:503});
 }
}
