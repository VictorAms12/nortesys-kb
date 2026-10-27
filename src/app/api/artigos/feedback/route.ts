import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {urlArtigoValida} from "../../../../lib/interacoes";
import {carregarTodosArtigos} from "../../../../lib/artigos-banco";
import {salvarFeedback} from "../../../../lib/feedback-artigo";
import {migracao009Aplicada} from "../../../../lib/migracao-009";
import {registrarAuditoriaSegura} from "../../../../lib/auditoria-eventos";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
function erro(mensagem:string,status:number){return NextResponse.json({erro:mensagem},{status,headers});}
export async function POST(req:NextRequest){
 if(!verificarOrigemPost(req.headers).valida)return erro("Origem inválida.",403);
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return erro("Sessão expirada.",401);
 if(!req.headers.get("content-type")?.includes("application/json"))return erro("Envie JSON.",415);
 const declarado=req.headers.get("content-length");
 if(declarado!==null&&(!/^\d+$/.test(declarado)||Number(declarado)>700))return erro("Requisição inválida.",413);
 try{
  const body=await req.text();if(body.length>700)return erro("Requisição inválida.",413);
  const dados:unknown=JSON.parse(body);
  if(!dados||typeof dados!=="object")return erro("Dados inválidos.",400);
  const {url,resolveu}=dados as Record<string,unknown>;
  if(!urlArtigoValida(url)||typeof resolveu!=="boolean")return erro("Dados inválidos.",400);
  if(!(await migracao009Aplicada()))return erro("Feedback ainda não habilitado. Aguarde a migração 009.",503);
  if(!(await carregarTodosArtigos(usuario.papel)).some(a=>a.url===url))return erro("Artigo não encontrado.",404);
  await salvarFeedback(usuario.id,url,resolveu);
  await registrarAuditoriaSegura(usuario.id,"artigo_feedback_registrado",url,{limitarMinutos:10});
  return NextResponse.json({ok:true,resolveu},{headers});
 }catch(e){
  if(e instanceof SyntaxError)return erro("JSON inválido.",400);
  console.error("[feedback] Falha ao registrar feedback",e instanceof Error?e.name:"erro");
  return erro("Feedback indisponível.",503);
 }
}
