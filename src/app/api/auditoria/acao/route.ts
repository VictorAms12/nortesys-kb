import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {EVENTOS_CLIENTE} from "../../../../lib/auditoria-eventos-tipos";
import {registrarAuditoriaSegura} from "../../../../lib/auditoria-eventos";
import {idArtigoValido} from "../../../../lib/artigos-banco";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return NextResponse.json({erro:"Não autenticado"},{status:401});
 const size=Number(req.headers.get("content-length")??0);
 if(size>512||!req.headers.get("content-type")?.includes("application/json"))return NextResponse.json({erro:"Dados inválidos"},{status:400});
 let body:unknown;try{body=await req.json();}catch{return NextResponse.json({erro:"Dados inválidos"},{status:400});}
 if(!body||typeof body!=="object")return NextResponse.json({erro:"Dados inválidos"},{status:400});
 const obj=body as Record<string,unknown>;
 if(typeof obj.evento!=="string"||!EVENTOS_CLIENTE.some(x=>x===obj.evento))
    return NextResponse.json({erro:"Evento inválido"},{status:400});
 if(obj.evento.startsWith("artigo_inicio_")&&usuario.papel==="leitor")
    return NextResponse.json({erro:"Acesso negado"},{status:403});
 if(obj.evento==="artigo_inicio_edicao"&&!idArtigoValido(obj.alvo as string))
    return NextResponse.json({erro:"Artigo inválido"},{status:400});
 const alvo=obj.evento.startsWith("artigo_inicio_")&&typeof obj.alvo==="string"
   ?(idArtigoValido(obj.alvo)?obj.alvo:"novo"):obj.evento;
 await registrarAuditoriaSegura(usuario.id,obj.evento,alvo,{limitarMinutos:10});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
