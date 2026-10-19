import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {slugificarTitulo} from "../src/components/titulo-slug-artigo";

test("Fase 7C.3: slug automatico sem acentos e caracteres especiais",()=>{
  assert.equal(slugificarTitulo("Rejeição 590 — CFOP / Operação"),"rejeicao-590-cfop-operacao");
  assert.equal(slugificarTitulo("  Cliente   duplicado!  "),"cliente-duplicado");
  assert.ok(slugificarTitulo("A".repeat(120)).length<=100);
});
test("Fase 7C.2: anexos privados vinculados, validacao do schema e cota",async t=>{
  const db=new PGlite();t.after(()=>db.close());
  for(const script of ["001_auth","002_painel","005_anexos"])
    await db.exec(readFileSync(`db/${script}.sql`,"utf8"));
  // Garantir que a migração possa ser repetida no mesmo banco.
  await db.exec(readFileSync("db/005_anexos.sql","utf8"));
  const usuarioId=randomUUID(),artigoId=randomUUID(),anexoId=randomUUID();
  await db.query(`INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash)
    VALUES ($1,'editor-teste','Editor','editor',$2,$3)`,[usuarioId,"a".repeat(32),"b".repeat(128)]);
  await db.query(`INSERT INTO kb_artigos(id,categoria,slug,titulo,status,conteudo,criado_por,atualizado_por)
    VALUES ($1,'erp','teste-anexos','PDF Teste','rascunho','Markdown Teste',$2,$2)`,[artigoId,usuarioId]);
  const caminho=`kb-anexos/${anexoId}.pdf`;
  await db.query(`INSERT INTO kb_anexos(id,artigo_id,usuario_id,blob_caminho,nome,tamanho)
    VALUES ($1,$2,$3,$4,'Manual de apoio.pdf',1024)`,[anexoId,artigoId,usuarioId,caminho]);
  const pendente=await db.query<{estado:string}>(`SELECT estado FROM kb_anexos WHERE id=$1`,[anexoId]);
  assert.equal(pendente.rows[0].estado,"pendente");
  await db.query(`UPDATE kb_anexos SET estado='pronta' WHERE id=$1`,[anexoId]);
  let pronto=await db.query<{nome:string}>(`SELECT nome FROM kb_anexos
    WHERE id=$1 AND artigo_id=$2 AND estado='pronta'`,[anexoId,artigoId]);
  assert.equal(pronto.rows.length,1);
  await db.query(`UPDATE kb_anexos SET estado='removido' WHERE id=$1`,[anexoId]);
  pronto=await db.query(`SELECT nome FROM kb_anexos WHERE id=$1 AND estado='pronta'`,[anexoId]);
  assert.equal(pronto.rows.length,0);
  await assert.rejects(db.query(`INSERT INTO kb_anexos(id,artigo_id,usuario_id,blob_caminho,nome,tamanho)
    VALUES ($1,$2,$3,$4,'Grande.pdf',3145729)`,[randomUUID(),artigoId,usuarioId,`kb-anexos/${randomUUID()}.pdf`]));
  for(let i=0;i<12;i++){
    const q=await db.query(`INSERT INTO kb_anexo_limites(usuario_id,janela_em,quantidade)
      VALUES ($1,NOW(),1) ON CONFLICT(usuario_id) DO UPDATE SET
        quantidade=kb_anexo_limites.quantidade+1
      WHERE kb_anexo_limites.quantidade<12 RETURNING quantidade`,[usuarioId]);
    assert.equal(q.rows.length,1);
  }
  const bloqueado=await db.query(`INSERT INTO kb_anexo_limites(usuario_id,janela_em,quantidade)
    VALUES ($1,NOW(),1) ON CONFLICT(usuario_id) DO UPDATE SET
      quantidade=kb_anexo_limites.quantidade+1
    WHERE kb_anexo_limites.quantidade<12 RETURNING quantidade`,[usuarioId]);
  assert.equal(bloqueado.rows.length,0);
});
