import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { NOME_COOKIE, obterSessao } from "../../../../lib/sessao";
import { verificarOrigemPost } from "../../../../lib/origem";
import { consultar } from "../../../../lib/banco";
import { UUID, PAPEIS, entradaContaValida, gerarCredencialHash, registrarEvento } from "../../../../lib/admin-usuarios";

export const runtime="nodejs"; export const dynamic="force-dynamic";
function voltar(req:NextRequest, codigo:string) { const url=new URL("/admin/usuarios",req.url);url.searchParams.set("aviso",codigo);return NextResponse.redirect(url,{status:303}); }
const nomeValido = z.string().trim().min(2).max(80);
export async function POST(req:NextRequest) {
  if (!verificarOrigemPost(req.headers).valida) return new NextResponse("Origem inválida",{status:403});
  const conta=await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
  if (!conta || conta.papel!=="administrador") return new NextResponse("Acesso negado",{status:403});
  const tamanho=Number(req.headers.get("content-length")??0);
  if (!req.headers.get("content-type")?.includes("application/x-www-form-urlencoded") || tamanho>10000) return new NextResponse("Dados inválidos",{status:400});
  try {
    const f=await req.formData();
    const valor=(k:string)=>typeof f.get(k)==="string" ? String(f.get(k)).trim() : "";
    const acao=valor("acao");const usuario=valor("usuario").toLowerCase();const id=valor("id");
    if (acao==="criar") {
      const nome=nomeValido.parse(valor("nome"));const papel=valor("papel");
      if (!entradaContaValida(usuario,nome,papel)) return voltar(req,"dados");
      const {salt,hash}=await gerarCredencialHash(typeof f.get("credencial")==="string" ? String(f.get("credencial")) : "");
      const inserido=await consultar<{id:string}>(`INSERT INTO kb_usuarios(usuario,nome,papel,senha_salt,senha_hash)
        VALUES ($1,$2,$3,$4,$5) RETURNING id`,[usuario,nome,papel,salt,hash]);
      await registrarEvento(conta.id,"usuario_criado",inserido[0].id);
      return voltar(req,"criado");
    }
    if (!UUID.test(id)) return voltar(req,"dados");
    if (id===conta.id && (acao==="desativar" || acao==="editar")) return voltar(req,"proprio");
    if (acao==="senha") {
      const {salt,hash}=await gerarCredencialHash(typeof f.get("credencial")==="string" ? String(f.get("credencial")) : "");
      const alterados=await consultar<{id:string}>(`UPDATE kb_usuarios SET senha_salt=$2, senha_hash=$3,
        versao_sessao=versao_sessao+1, atualizado_em=NOW() WHERE id=$1 RETURNING id`,[id,salt,hash]);
      if (!alterados.length) return voltar(req,"dados");
      await registrarEvento(conta.id,"usuario_senha_redefinida",id);
      return voltar(req,"credencial_redefinida");
    }
    if (acao==="editar" || acao==="desativar" || acao==="ativar") {
      const nome=nomeValido.parse(valor("nome"));const papel=valor("papel");
      const papelFinal=acao==="editar" ? papel : null;
      if (acao==="editar" && !PAPEIS.includes(papelFinal as typeof PAPEIS[number])) return voltar(req,"dados");
      // Recusa atualização que removeria o último administrador no estado consultado.
      const novoAtivo=acao==="desativar" ? false : acao==="ativar" ? true : null;
      const resultado=await consultar<{id:string}>(`WITH atual AS (
          SELECT id, papel, ativo FROM kb_usuarios WHERE id=$1
        ), alterado AS (
          UPDATE kb_usuarios u SET
            nome=CASE WHEN $2::text IS NOT NULL THEN $2 ELSE u.nome END,
            papel=COALESCE($3::text,u.papel), ativo=COALESCE($4::boolean,u.ativo),
            versao_sessao=u.versao_sessao+1, atualizado_em=NOW()
          WHERE u.id=$1 AND (
            NOT EXISTS(SELECT 1 FROM atual WHERE papel='administrador' AND ativo=true)
            OR (COALESCE($3::text,u.papel)='administrador' AND COALESCE($4::boolean,u.ativo)=true)
            OR (SELECT COUNT(*) FROM kb_usuarios WHERE papel='administrador' AND ativo=true)>1
          ) RETURNING u.id
        ) SELECT id FROM alterado`,[
          id,acao==="editar"?nome:null,papelFinal,novoAtivo]);
      if (!resultado.length) return voltar(req,"ultimo_admin");
      await registrarEvento(conta.id,`usuario_${acao}`,id);
      return voltar(req,"salvo");
    }
    return voltar(req,"dados");
  } catch(error) {
    if (error && typeof error === "object" && "code" in error && error.code==="23505") return voltar(req,"duplicado");
    if (error instanceof z.ZodError || error instanceof Error && error.message==="credencial_invalida") return voltar(req,"dados");
    console.error("Falha administrativa de usuário",error instanceof Error?error.name:"erro");
    return voltar(req,"indisponivel");
  }
}
