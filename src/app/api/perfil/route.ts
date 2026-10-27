import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../lib/sessao";
import {consultar} from "../../../lib/banco";
export async function GET(req:NextRequest){
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 const rows=await consultar<{bio:string|null;preferencias:unknown}>(
  "SELECT bio,preferencias_notificacoes AS preferencias FROM kb_usuarios WHERE id=$1",[u.id]);
 return NextResponse.json({nome:u.nome,usuario:u.usuario,papel:u.papel,...rows[0]},{headers:{"Cache-Control":"private, no-store"}});
}
