import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { TAG_INDICE_BUSCA } from "../../../../lib/cache-busca";
import matter from "gray-matter";
import { z } from "zod";
import { NOME_COOKIE, obterSessao } from "../../../../lib/sessao";
import { verificarOrigemPost } from "../../../../lib/origem";
import { consultar } from "../../../../lib/banco";
import { idArtigoValido, obterRegistroArtigo } from "../../../../lib/artigos-banco";
import { carregarArtigos } from "../../../../lib/artigos";
import { criarTextoDoFormulario } from "../../../../lib/formulario-artigo";
import { registrarEvento } from "../../../../lib/admin-usuarios";

export const runtime="nodejs"; export const dynamic="force-dynamic";
function voltar(req:NextRequest,codigo:string,id?:string) {
  const caminho=id ? `/admin/artigos/${id}` : "/admin/artigos/novo";
  const url=new URL(caminho,req.url);url.searchParams.set("aviso",codigo);
  return NextResponse.redirect(url,{status:303});
}
export async function POST(req:NextRequest) {
  if (!verificarOrigemPost(req.headers).valida) return new NextResponse("Origem inválida",{status:403});
  const conta=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
  if (!conta || !["administrador","editor"].includes(conta.papel)) return new NextResponse("Acesso negado",{status:403});
  const tamanho=Number(req.headers.get("content-length")??0);
  if (!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded") || tamanho>300000) return new NextResponse("Formulário inválido",{status:400});
  let id:string|undefined;
  try {
    const form=await req.formData();
    const acao=form.get("acao");
    id=typeof form.get("id")==="string"?String(form.get("id")):undefined;
    if (acao==="arquivar") {
      if (!id || !idArtigoValido(id)) return voltar(req,"dados");
      const atual=await obterRegistroArtigo(id);
      if (!atual || atual.arquivado) return voltar(req,"dados",id);
      if (Number(form.get("versao"))!==atual.versao) return voltar(req,"conflito",id);
      const atualizado=await consultar<{id:string}>(`WITH alterado AS (
          UPDATE kb_artigos SET arquivado=true, versao=versao+1, atualizado_por=$2, atualizado_em=NOW()
          WHERE id=$1 AND versao=$3 AND arquivado=false RETURNING id,versao,conteudo
        ), versao AS (
          INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao,editor_id)
          SELECT id,versao,conteudo,'arquivado',$2 FROM alterado RETURNING artigo_id
        ) SELECT artigo_id AS id FROM versao`,[id,conta.id,atual.versao]);
      if (!atualizado.length) return voltar(req,"conflito",id);
      revalidateTag(TAG_INDICE_BUSCA, { expire: 0 });
      await registrarEvento(conta.id,"artigo_arquivado",id);
      return NextResponse.redirect(new URL("/admin/artigos?aviso=arquivado",req.url),{status:303});
    }
    if (acao!=="criar" && acao!=="salvar") return voltar(req,"dados",id);
    const atual=acao==="salvar" && id ? await obterRegistroArtigo(id):null;
    if (acao==="salvar" && (!atual || atual.arquivado)) return voltar(req,"dados",id);
    const dataOriginal=atual ? matter(atual.conteudo).data.criadoEm : null;
    const campos=criarTextoDoFormulario(form,conta.nome,dataOriginal instanceof Date ? dataOriginal.toISOString().slice(0,10) : typeof dataOriginal==="string"?dataOriginal:undefined);
    const titulo=campos.titulo;const categoria=campos.categoria;const slug=campos.slug;
    const arquivoJaExiste=carregarArtigos().some(a=>a.slug===slug&&a.categoria===categoria);
    if (arquivoJaExiste && (!atual || atual.categoria!==categoria || atual.slug!==slug)) return voltar(req,"conflito_arquivo",id);
    if (acao==="criar") {
      const result=await consultar<{id:string}>(`WITH novo AS (
          INSERT INTO kb_artigos(categoria,slug,titulo,status,conteudo,criado_por,atualizado_por)
          VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING id,versao,conteudo
        ), versao AS (
          INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao,editor_id)
          SELECT id,versao,conteudo,'criado',$6 FROM novo RETURNING artigo_id
        ) SELECT artigo_id AS id FROM versao`,[categoria,slug,titulo,campos.status,campos.conteudo,conta.id]);
      id=result[0]?.id;
      if (!id) return voltar(req,"indisponivel");
      revalidateTag(TAG_INDICE_BUSCA, { expire: 0 });
      await registrarEvento(conta.id,"artigo_criado",id);
    } else {
      if (!id || !idArtigoValido(id)) return voltar(req,"dados");
      const versao=Number(form.get("versao"));
      if (!Number.isSafeInteger(versao) || versao<1 || versao!==atual?.versao) return voltar(req,"conflito",id);
      const result=await consultar<{id:string}>(`WITH alterado AS (
          UPDATE kb_artigos SET categoria=$2,slug=$3,titulo=$4,status=$5,conteudo=$6,
            versao=versao+1,atualizado_por=$7,atualizado_em=NOW()
          WHERE id=$1 AND versao=$8 AND arquivado=false RETURNING id,versao,conteudo
        ), versao AS (
          INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao,editor_id)
          SELECT id,versao,conteudo,'editado',$7 FROM alterado RETURNING artigo_id
        ) SELECT artigo_id AS id FROM versao`,[id,categoria,slug,titulo,campos.status,campos.conteudo,conta.id,versao]);
      if (!result.length) return voltar(req,"conflito",id);
      revalidateTag(TAG_INDICE_BUSCA, { expire: 0 });
      await registrarEvento(conta.id,"artigo_editado",id);
    }
    return voltar(req,"salvo",id);
  } catch(error) {
    if (error && typeof error==="object" && "constraint" in error && error.constraint==="kb_imagens_referencia") return voltar(req,"imagens",id);
    if (error && typeof error==="object" && "code" in error && error.code==="23505") return voltar(req,"duplicado",id);
    if (error instanceof z.ZodError || error instanceof Error && error.name==="ErroConteudo") return voltar(req,"validacao",id);
    console.error("Falha administrativa de artigo",error instanceof Error?error.name:"erro");
    return voltar(req,"indisponivel",id);
  }
}
