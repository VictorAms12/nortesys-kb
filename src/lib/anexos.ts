import "server-only";
import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { consultar } from "./banco";
import { obterSessao, NOME_COOKIE } from "./sessao";
import { verificarOrigemPost } from "./origem";
import { registrarEvento } from "./admin-usuarios";

const TAMANHO_MAXIMO_PDF = 3 * 1024 * 1024;
const LIMITE_FORMULARIO = TAMANHO_MAXIMO_PDF + 16_384;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cabecalhos = {"Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff", Vary:"Cookie"};
export type AnexoArtigo = {id:string; nome:string; tamanho:number; enviado_em:string};
type RegistroAnexo = AnexoArtigo & {
  blob_caminho:string;mime:string;estado:string;artigo_status:string;artigo_arquivado:boolean;
};
class ErroAnexo extends Error {
  constructor(public status:number, message:string) {super(message);}
}
function erro(mensagem:string,status:number):Response {
  return Response.json({erro:mensagem},{status,headers:cabecalhos});
}
function semTabela(e:unknown):boolean {
  return typeof e==="object" && e!==null && "code" in e && e.code==="42P01";
}
/** Os links só são mostrados a leitores quando o artigo está disponível. A API repete a verificação. */
export async function listarAnexosArtigo(id:string):Promise<AnexoArtigo[]> {
  if (!UUID.test(id)) return [];
  try {
    return await consultar<AnexoArtigo>(`SELECT id,nome,tamanho,enviado_em::text AS enviado_em
      FROM kb_anexos WHERE artigo_id=$1 AND estado='pronta' ORDER BY enviado_em DESC LIMIT 100`,[id]);
  } catch(e) {
    if (semTabela(e)) return []; // Preview pode ser acessado antes de aplicar a migração 005.
    throw e;
  }
}
export async function listarAnexosPorChave(categoria:string,slug:string):Promise<AnexoArtigo[]> {
  try {
    return await consultar<AnexoArtigo>(`SELECT x.id,x.nome,x.tamanho,x.enviado_em::text AS enviado_em
      FROM kb_anexos x JOIN kb_artigos a ON a.id=x.artigo_id
      WHERE a.categoria=$1 AND a.slug=$2 AND x.estado='pronta' AND NOT a.arquivado
      ORDER BY x.enviado_em DESC LIMIT 100`,[categoria,slug]);
  } catch(e) {
    if (semTabela(e)) return [];
    throw e;
  }
}
function nomeSeguro(nome:string):string {
  const ultimo=nome.split(/[\\/]/).pop()??"";
  const limpo=ultimo.replace(/[\u0000-\u001f\u007f<>:"|?*]/g,"").trim().replace(/\s+/g," ").slice(0,160);
  if (!/\.pdf$/i.test(limpo) || limpo.length<5) throw new ErroAnexo(400,"Nome de arquivo PDF inválido.");
  return limpo;
}
function verificarPDF(bytes:Uint8Array):void {
  if (bytes.length<100 || bytes.length>TAMANHO_MAXIMO_PDF) throw new ErroAnexo(413,"PDF inválido ou maior que 3 MB.");
  if (Buffer.from(bytes.subarray(0,5)).toString("ascii")!=="%PDF-") throw new ErroAnexo(415,"Selecione um PDF válido.");
  if (!Buffer.from(bytes.subarray(Math.max(0,bytes.length-2048))).includes(Buffer.from("%%EOF"))) {
    throw new ErroAnexo(415,"PDF incompleto ou inválido.");
  }
}
/** Impede consumo ilimitado de memória mesmo se Content-Length estiver ausente. */
async function formularioLimitado(req:NextRequest):Promise<FormData> {
  const declarado=req.headers.get("content-length");
  if (declarado!==null && (!/^\d+$/.test(declarado) || Number(declarado)>LIMITE_FORMULARIO))
    throw new ErroAnexo(413,"O PDF deve ter até 3 MB.");
  if (!req.body) throw new ErroAnexo(400,"Envie um PDF.");
  const leitor=req.body.getReader();const partes:Uint8Array[]=[];let total=0;
  try {
    while(true) {
      const {done,value}=await leitor.read();if(done)break;
      total+=value.byteLength;
      if(total>LIMITE_FORMULARIO) {await leitor.cancel();throw new ErroAnexo(413,"O PDF deve ter até 3 MB.");}
      partes.push(value);
    }
  } finally {leitor.releaseLock();}
  try {
    return await new Response(Buffer.concat(partes),{headers:{"Content-Type":req.headers.get("content-type")??""}}).formData();
  } catch {throw new ErroAnexo(400,"Formulário de anexo inválido.");}
}
async function reservarCota(usuario:string):Promise<boolean> {
  const linhas=await consultar<{quantidade:number}>(`INSERT INTO kb_anexo_limites(usuario_id,janela_em,quantidade)
    VALUES ($1,NOW(),1)
    ON CONFLICT(usuario_id) DO UPDATE SET
      quantidade=CASE WHEN kb_anexo_limites.janela_em<=NOW()-INTERVAL '1 hour' THEN 1 ELSE kb_anexo_limites.quantidade+1 END,
      janela_em=CASE WHEN kb_anexo_limites.janela_em<=NOW()-INTERVAL '1 hour' THEN NOW() ELSE kb_anexo_limites.janela_em END
    WHERE kb_anexo_limites.janela_em<=NOW()-INTERVAL '1 hour' OR kb_anexo_limites.quantidade<12
    RETURNING quantidade`,[usuario]);
  return linhas.length>0;
}
export async function enviarAnexo(req:NextRequest):Promise<Response> {
  if(!verificarOrigemPost(req.headers).valida)return erro("Origem inválida.",403);
  let etapa="sessao";
  try {
    const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
    if(!usuario)return erro("Faça login para enviar anexos.",401);
    if(usuario.papel==="leitor")return erro("Acesso restrito a editores.",403);
    if(!req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;"))
      return erro("Selecione um PDF.",415);
    etapa="arquivo";
    const form=await formularioLimitado(req);
    const arquivo=form.get("arquivo");
    const artigoId=form.get("artigoId");
    if(!(arquivo instanceof File)||form.getAll("arquivo").length!==1)
      return erro("Selecione um único PDF.",400);
    if(typeof artigoId!=="string"||!UUID.test(artigoId))return erro("Artigo inválido.",400);
    if(arquivo.type!=="application/pdf" && arquivo.type!=="")return erro("Somente PDF é permitido.",415);
    const nome=nomeSeguro(arquivo.name);
    const bytes=new Uint8Array(await arquivo.arrayBuffer());verificarPDF(bytes);
    etapa="artigo";
    const artigos=await consultar<{id:string}>(`SELECT id FROM kb_artigos WHERE id=$1 AND arquivado=false LIMIT 1`,[artigoId]);
    if(!artigos.length)return erro("Artigo não encontrado ou arquivado.",404);
    etapa="cota";
    if(!await reservarCota(usuario.id))return erro("Limite de 12 anexos por hora atingido.",429);
    const id=randomUUID();const caminho=`kb-anexos/${id}.pdf`;
    etapa="registro";
    await consultar(`INSERT INTO kb_anexos(id,artigo_id,usuario_id,blob_caminho,nome,mime,tamanho)
      VALUES($1,$2,$3,$4,$5,'application/pdf',$6)`,[id,artigoId,usuario.id,caminho,nome,bytes.length]);
    etapa="blob";
    try {
      await put(caminho,Buffer.from(bytes),{access:"private",contentType:"application/pdf",addRandomSuffix:false,allowOverwrite:false,
        abortSignal:AbortSignal.timeout(30_000)});
      etapa="confirmacao";
      await consultar(`UPDATE kb_anexos SET estado='pronta' WHERE id=$1`,[id]);
    } catch (falha) {
      console.error("[anexos] Falha na etapa",etapa,falha instanceof Error?falha.name:"desconhecida");
      let estado="falhou";
      try {await del(caminho,{abortSignal:AbortSignal.timeout(15_000)});}
      catch {estado="limpeza_pendente";}
      try {await consultar(`UPDATE kb_anexos SET estado=$2 WHERE id=$1`,[id,estado]);}catch{console.error("[anexos] Falha na compensação do banco");}
      return erro("Não foi possível armazenar o PDF. Consulte o log do servidor.",503);
    }
    try {await registrarEvento(usuario.id,"anexo_enviado",id);}catch{console.error("[anexos] Falha ao registrar auditoria");}
    return Response.json({anexo:{id,nome,tamanho:bytes.length,enviado_em:new Date().toISOString()}},{status:201,headers:cabecalhos});
  } catch(falha) {
    if(falha instanceof ErroAnexo)return erro(falha.message,falha.status);
    console.error("[anexos] Falha na etapa",etapa,falha instanceof Error?falha.name:"desconhecida");
    return erro(semTabela(falha)?"Migração 005 de anexos não aplicada neste banco.":"Serviço de anexos indisponível.",503);
  }
}
export async function baixarAnexo(req:NextRequest,id:string):Promise<Response> {
  try {
    const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
    if(!usuario)return erro("Faça login para baixar anexos.",401);
    if(!UUID.test(id))return erro("Anexo não encontrado.",404);
    const linhas=await consultar<RegistroAnexo>(`SELECT x.id,x.nome,x.tamanho,x.enviado_em::text AS enviado_em,
      x.blob_caminho,x.mime,x.estado,a.status AS artigo_status,a.arquivado AS artigo_arquivado
      FROM kb_anexos x JOIN kb_artigos a ON a.id=x.artigo_id WHERE x.id=$1 LIMIT 1`,[id]);
    const x=linhas[0];
    if(!x || x.estado!=="pronta" || usuario.papel==="leitor" &&
      (x.artigo_arquivado || !["revisado","obsoleto"].includes(x.artigo_status)))
      return erro("Anexo não encontrado.",404);
    if(x.blob_caminho!==`kb-anexos/${id}.pdf` || x.mime!=="application/pdf")
      return erro("Anexo indisponível.",503);
    const objeto=await get(x.blob_caminho,{access:"private",abortSignal:AbortSignal.timeout(30_000)});
    if(!objeto || objeto.statusCode!==200)return erro("Anexo não encontrado.",404);
    if(objeto.blob.size!==x.tamanho || objeto.blob.contentType!==x.mime) {
      await objeto.stream.cancel();return erro("Anexo indisponível.",503);
    }
    // Sempre forçar download: não executar conteúdo ativo de PDF na origem do KB.
    const nomeCodificado=encodeURIComponent(x.nome);
    return new Response(objeto.stream,{headers:{...cabecalhos,
      "Content-Type":"application/pdf","Content-Length":String(x.tamanho),
      "Content-Disposition":`attachment; filename="documento.pdf"; filename*=UTF-8''${nomeCodificado}`,
      "Cross-Origin-Resource-Policy":"same-origin","Content-Security-Policy":"sandbox"}});
  } catch(falha) {
    console.error("[anexos] Falha no download",falha instanceof Error?falha.name:"desconhecida");
    return erro("Anexo indisponível.",503);
  }
}

/** Exclusão lógica: mantém objeto e metadados para auditoria e reconciliação. */
export async function removerAnexo(req:NextRequest,id:string):Promise<Response> {
  if(!verificarOrigemPost(req.headers).valida)return erro("Origem inválida.",403);
  try {
    const usuario=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
    if(!usuario)return erro("Autenticação necessária.",401);
    if(usuario.papel==="leitor")return erro("Acesso restrito a editores.",403);
    if(!UUID.test(id))return erro("Anexo não encontrado.",404);
    const alterados=await consultar<{id:string}>(`UPDATE kb_anexos x SET estado='removido'
      WHERE x.id=$1 AND x.estado='pronta' AND EXISTS (
        SELECT 1 FROM kb_artigos a WHERE a.id=x.artigo_id AND NOT a.arquivado
      ) RETURNING x.id`,[id]);
    if(!alterados.length)return erro("Anexo não encontrado.",404);
    try {await registrarEvento(usuario.id,"anexo_removido",id);}
    catch {console.error("[anexos] Falha ao auditar remoção");}
    return Response.json({ok:true},{headers:cabecalhos});
  } catch(falha) {
    console.error("[anexos] Erro ao remover",falha instanceof Error?falha.name:"desconhecida");
    return erro("Não foi possível remover o anexo.",503);
  }
}
