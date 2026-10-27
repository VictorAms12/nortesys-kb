import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {put,del} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {consultar} from "../../../../lib/banco";
import {validarImagem,ErroImagem} from "../../../../lib/imagens-validacao";
const MAX=2*1024*1024+32768;
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});
 const size=Number(req.headers.get("content-length")??0);
 if(!Number.isFinite(size)||size>MAX)return NextResponse.json({erro:"Imagem muito grande"},{status:413});
 try{
  const form=await req.formData();
  const file=form.get("imagem");
  if(!(file instanceof File)||form.getAll("imagem").length!==1||file.size>2*1024*1024)
   return NextResponse.json({erro:"Imagem inválida"},{status:400});
  const img=await validarImagem(new Uint8Array(await file.arrayBuffer()),file.type);
  const caminho="kb-perfis/"+randomUUID()+"."+img.extensao;
  await put(caminho,Buffer.from(img.bytes),{access:"private",contentType:img.mime,addRandomSuffix:false,allowOverwrite:false});
  try{
   const anteriores=await consultar<{avatar_caminho:string|null}>("UPDATE kb_usuarios SET avatar_caminho=$2,atualizado_em=NOW() WHERE id=$1 RETURNING avatar_caminho",[u.id,caminho]);
   if(!anteriores.length)throw Error("Conta indisponível");
  }catch(e){await del(caminho).catch(()=>{});throw e;}
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  if(e instanceof ErroImagem)return NextResponse.json({erro:e.message},{status:e.status});
  return NextResponse.json({erro:"Não foi possível salvar sua foto"},{status:503});
 }
}
