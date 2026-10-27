import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {NOME_COOKIE,obterSessao} from "../../../../lib/sessao";
import {verificarOrigemPost} from "../../../../lib/origem";
import {termoEstatisticoSeguro} from "../../../../lib/estatisticas-busca";
import {consultar} from "../../../../lib/banco";
import {carregarTodosArtigos} from "../../../../lib/artigos-banco";
import {criarIndiceBusca} from "../../../../lib/indice-busca";
import {criarBuscador,executarBusca} from "../../../../lib/busca";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const fail=(s:number)=>NextResponse.json({ok:false},{status:s,headers:{"Cache-Control":"private, no-store"}});
 if(!verificarOrigemPost(req.headers).valida)return fail(403);
 const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
 if(!usuario)return fail(401);
 if(!req.headers.get("content-type")?.includes("application/json"))return fail(415);
 const declarado=req.headers.get("content-length");
 if(declarado!==null&&(!/^\d+$/.test(declarado)||Number(declarado)>300))return fail(413);
 try{
  const raw=await req.text();if(raw.length>300)return fail(413);
  const parsed:unknown=JSON.parse(raw);
  const termo=termoEstatisticoSeguro(parsed&&typeof parsed==="object"?(parsed as {termo?:unknown}).termo:null);
  if(!termo)return fail(400);
  // Nunca confiar no navegador para afirmar que a pesquisa não retornou resultado.
  const busca=criarBuscador(criarIndiceBusca(await carregarTodosArtigos(usuario.papel)));
  if(executarBusca(busca,termo).length>0)return NextResponse.json({ok:true});
  // Rate limit distribuído: um registro de lacuna a cada 15 segundos por conta.
  await consultar(`WITH permitidos AS (
   INSERT INTO kb_busca_estatistica_limites(usuario_id,ultima_em) VALUES($1,NOW())
   ON CONFLICT(usuario_id) DO UPDATE SET ultima_em=NOW()
    WHERE kb_busca_estatistica_limites.ultima_em<NOW()-INTERVAL '15 seconds'
   RETURNING usuario_id
  ) INSERT INTO kb_buscas_sem_resultado(termo,dia,quantidade)
   SELECT $2,CURRENT_DATE,1 FROM permitidos
   ON CONFLICT(termo,dia) DO UPDATE SET quantidade=kb_buscas_sem_resultado.quantidade+1`,
  [usuario.id,termo]);
  return NextResponse.json({ok:true});
 }catch(e){
  if(e instanceof SyntaxError)return fail(400);
  console.error("[busca] Estatística indisponível",e instanceof Error?e.name:"erro");
  return fail(503);
 }
}
