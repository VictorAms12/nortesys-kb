import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {dividirInstrucoesSql} from "../scripts/migracoes-sql.mjs";

test("Fase 4: índice full-text PostgreSQL e filtro de visibilidade dos candidatos",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth.sql","002_painel.sql","016_indices_busca_artigos.sql"]){
  await db.transaction(async tx=>{
   for(const statement of dividirInstrucoesSql(readFileSync("db/"+file,"utf8")))await tx.query(statement);
  });
 }
 const indices=await db.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='kb_artigos_texto_fts_idx'");
 assert.equal(indices.rows.length,1);
 assert.match(indices.rows[0].indexdef,/gin/i);
 const autor=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,'testeindice','Pessoa Índice','editor',$2,$3)",[autor,"a".repeat(32),"b".repeat(128)]);
 for(const [slug,status,conteudo] of [
  ["rejeicao-nfe","revisado","Ao transmitir a NF-e, verifique a rejeição fiscal no ERP."],
  ["rascunho-fiscal","rascunho","Procedimento fiscal interno de rejeição em testes."],
  ["rede-privada","revisado","Configurar cabo de rede e ponto físico."]]){
  await db.query("INSERT INTO kb_artigos(categoria,slug,titulo,status,conteudo,criado_por) VALUES ('fiscal',$1,'Orientação fiscal',$2,$3,$4)",[slug,status,conteudo,autor]);
 }
 const pesquisar=async(papel,termo)=>(
  await db.query(`SELECT slug FROM kb_artigos WHERE arquivado=FALSE
    AND ($1::text<>'leitor' OR status<>'rascunho')
    AND to_tsvector('portuguese',COALESCE(titulo,'') || ' ' || COALESCE(conteudo,''))
       @@ plainto_tsquery('portuguese',$2)`,[papel,termo])).rows.map(x=>x.slug).sort();
 assert.deepEqual(await pesquisar("leitor","rejeição"),["rejeicao-nfe"]);
 assert.deepEqual(await pesquisar("editor","rejeição"),["rascunho-fiscal","rejeicao-nfe"]);
 assert.deepEqual(await pesquisar("leitor","roteador"),[]);
 assert.deepEqual(await pesquisar("leitor","ponto"),["rede-privada"]);
});
