import type {NextRequest} from "next/server";
import {NextResponse,after} from "next/server";
import {randomUUID} from "node:crypto";
import {put,del} from "@vercel/blob";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {consultar} from "../../../../lib/banco";
import {validarImagem,ErroImagem} from "../../../../lib/imagens-validacao";
import {ErroFormularioLimitado,lerFormularioLimitado} from "../../../../lib/formulario-limitado";
const MAX=2*1024*1024+32768;
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return NextResponse.json({erro:"Origem inválida"},{status:403});
 const u=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!u)return NextResponse.json({erro:"Não autorizado"},{status:401});

 try{
  if(!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;"))
   return NextResponse.json({erro:"Envie uma imagem no formulário."},{status:415});
  const quota=await consultar<{quantidade:number}>(`INSERT INTO kb_avatar_limites(usuario_id,janela_em,quantidade)
    VALUES($1,NOW(),1)
    ON CONFLICT(usuario_id) DO UPDATE SET
     quantidade=CASE WHEN kb_avatar_limites.janela_em<=NOW()-INTERVAL '1 hour' THEN 1 ELSE kb_avatar_limites.quantidade+1 END,
     janela_em=CASE WHEN kb_avatar_limites.janela_em<=NOW()-INTERVAL '1 hour' THEN NOW() ELSE kb_avatar_limites.janela_em END
    WHERE kb_avatar_limites.janela_em<=NOW()-INTERVAL '1 hour' OR kb_avatar_limites.quantidade<12
    RETURNING quantidade`,[u.id]);
  if(!quota.length)return NextResponse.json({erro:"Limite de 12 fotos por hora atingido."},
   {status:429,headers:{"Retry-After":"3600"}});
  const form=await lerFormularioLimitado(req,MAX,{
   grande:"Imagem muito grande. Limite: 2 MB.",
   ausente:"Envie uma imagem.",
   invalido:"Formulário de imagem inválido."
  });
  const file=form.get("imagem");
  if(!(file instanceof File)||form.getAll("imagem").length!==1||file.size>2*1024*1024)
   return NextResponse.json({erro:"Imagem inválida"},{status:400});
  const img=await validarImagem(new Uint8Array(await file.arrayBuffer()),file.type);
  const anterior=await consultar<{avatar_caminho:string|null}>("SELECT avatar_caminho FROM kb_usuarios WHERE id=$1",[u.id]);
  const caminho="kb-perfis/"+randomUUID()+"."+img.extensao;
  await put(caminho,Buffer.from(img.bytes),{access:"private",contentType:img.mime,addRandomSuffix:false,allowOverwrite:false,abortSignal:AbortSignal.timeout(30000)});
  try{
   const linhas=await consultar<{id:string}>("UPDATE kb_usuarios SET avatar_caminho=$2,atualizado_em=NOW() WHERE id=$1 RETURNING id",[u.id,caminho]);
   if(!linhas.length)throw Error("Conta indisponível");
  }catch(e){await del(caminho).catch(()=>{});throw e;}
  const antigo=anterior[0]?.avatar_caminho;
  if(antigo&&antigo!==caminho&&/^kb-perfis\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(antigo))
   after(async()=>{
    await del(antigo,{abortSignal:AbortSignal.timeout(15000)})
     .catch(()=>console.error("[perfil] Não foi possível limpar avatar anterior."));
   });
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  if(e instanceof ErroImagem||e instanceof ErroFormularioLimitado)
   return NextResponse.json({erro:e.message},{status:e.status});
  return NextResponse.json({erro:"Não foi possível salvar sua foto"},{status:503});
 }
}
