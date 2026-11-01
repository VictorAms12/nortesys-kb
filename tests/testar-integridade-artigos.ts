import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {dividirInstrucoesSql} from "../scripts/migracoes-sql.mjs";
import {SQL_RESOLVER_ALIAS_ARTIGO} from "../src/lib/artigos-alias-sql";

const arquivos=["001_auth","002_painel","003_interacoes","005_anexos","006_chat",
 "007_chat_acoes","008_chat_imagens","009_fases_7h_7j_feedback","017_integridade_urls_artigos"];
async function preparar(db:PGlite){
 for(const nome of arquivos)await db.transaction(async tx=>{
  for(const comando of dividirInstrucoesSql(readFileSync(`db/${nome}.sql`,"utf8")))await tx.query(comando);
 });
}
async function usuario(db:PGlite,nome:string):Promise<string>{
 const id=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$2,'leitor',$3,$4)",
 [id,nome,"a".repeat(32),"b".repeat(128)]);
 return id;
}
async function artigo(db:PGlite,slug:string,status="revisado"):Promise<string>{
 const id=randomUUID();
 await db.query("INSERT INTO kb_artigos(id,categoria,slug,titulo,status,conteudo) VALUES($1,'erp',$2,'Procedimento ERP',$3,'Conteúdo de exemplo')",
 [id,slug,status]);
 return id;
}
const url=(slug:string)=>`/artigos/erp/${slug}`;
const q=async<T extends Record<string, unknown>>(db:PGlite,sql:string,args:unknown[]=[])=>(
 await db.query<T>(sql,args)).rows;

test("Fase 5: renomeação conserva favoritos, leituras, feedback e anexos em transação",async t=>{
 const db=new PGlite();t.after(()=>db.close());await preparar(db);
 const pessoa=await usuario(db,"integridade1");
 const id=await artigo(db,"slug-antigo");
 const anexo=randomUUID();
 await db.query("INSERT INTO kb_anexos(id,artigo_id,blob_caminho,nome,tamanho,estado) VALUES($1,$2,$3,'Manual.pdf',1000,'pronta')",
 [anexo,id,`kb-anexos/${anexo}.pdf`]);
 await db.query("INSERT INTO kb_favoritos(usuario_id,artigo_url) VALUES($1,$2)",[pessoa,url("slug-antigo")]);
 await db.query("INSERT INTO kb_leituras(usuario_id,artigo_url) VALUES($1,$2)",[pessoa,url("slug-antigo")]);
 await db.query("INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu) VALUES($1,$2,true)",[pessoa,url("slug-antigo")]);
 const renomeado=await q<{id:string}>(db,`WITH alterado AS (
   UPDATE kb_artigos SET slug=$2,versao=versao+1,atualizado_em=NOW() WHERE id=$1 AND versao=1
   RETURNING id,versao,conteudo
 ), historico AS (
   INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao)
   SELECT id,versao,conteudo,'editado' FROM alterado RETURNING artigo_id
 ) SELECT artigo_id AS id FROM historico`,[id,"slug-novo"]);
 assert.equal(renomeado.length,1);
 for(const tabela of ["kb_favoritos","kb_leituras","kb_artigo_feedback"]){
  assert.equal((await q<{artigo_url:string}>(db,`SELECT artigo_url FROM ${tabela} WHERE usuario_id=$1`,[pessoa]))[0].artigo_url,url("slug-novo"),tabela);
 }
 assert.equal((await q<{resolveu:boolean}>(db,"SELECT resolveu FROM kb_artigo_feedback WHERE usuario_id=$1",[pessoa]))[0].resolveu,true);
 assert.equal((await q<{id:string}>(db,`SELECT x.id FROM kb_anexos x JOIN kb_artigos a ON a.id=x.artigo_id
    WHERE a.slug='slug-novo' AND x.estado='pronta'`))[0].id,anexo);
 const alias=await q<{slug:string}>(db,SQL_RESOLVER_ALIAS_ARTIGO,[url("slug-antigo"),"leitor"]);
 assert.equal(alias[0]?.slug,"slug-novo");
 await assert.rejects(artigo(db,"slug-antigo"),/reservada|kb_artigo_aliases_pkey/);
 assert.equal((await q<{slug:string}>(db,"SELECT slug FROM kb_artigos WHERE id=$1",[id]))[0].slug,"slug-novo");
});

test("Fase 5: mesclagem determinística, retorno a alias antigo e filtros de acesso",async t=>{
 const db=new PGlite();t.after(()=>db.close());await preparar(db);
 // A migração pode ser aplicada novamente sem apagar os aliases existentes.
 await db.transaction(async tx=>{
  for(const comando of dividirInstrucoesSql(readFileSync("db/017_integridade_urls_artigos.sql","utf8")))await tx.query(comando);
 });
 const user=await usuario(db,"integridade2");
 const id=await artigo(db,"versao-a");
 await artigo(db,"outro-artigo");
 const antiga=url("versao-a"),nova=url("versao-b");
 for(const [caminho,criada] of [[antiga,"2026-09-01T00:00:00Z"],[nova,"2026-10-01T00:00:00Z"]])
  await db.query("INSERT INTO kb_favoritos(usuario_id,artigo_url,criado_em) VALUES($1,$2,$3)",[user,caminho,criada]);
 for(const [caminho,data] of [[antiga,"2026-09-01T00:00:00Z"],[nova,"2026-10-02T00:00:00Z"]])
  await db.query("INSERT INTO kb_leituras(usuario_id,artigo_url,acessado_em) VALUES($1,$2,$3)",[user,caminho,data]);
 await db.query(`INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu,criado_em,atualizado_em)
 VALUES($1,$2,true,'2026-09-01','2026-09-03'),($1,$3,false,'2026-09-04','2026-10-03')`,[user,antiga,nova]);
 await db.query("UPDATE kb_artigos SET slug='versao-b' WHERE id=$1",[id]);
 const fav=await q<{criado_em:string}>(db,"SELECT criado_em::text AS criado_em FROM kb_favoritos WHERE usuario_id=$1",[user]);
 assert.equal(fav.length,1);
 assert.match(fav[0].criado_em,/2026-09-01/);
 const lidas=await q<{acessado_em:string}>(db,"SELECT acessado_em::text AS acessado_em FROM kb_leituras WHERE usuario_id=$1",[user]);
 assert.equal(lidas.length,1);
 assert.match(lidas[0].acessado_em,/2026-10-02/);
 const feedback=await q<{resolveu:boolean;atualizado_em:string}>(db,
 "SELECT resolveu,atualizado_em::text AS atualizado_em FROM kb_artigo_feedback WHERE usuario_id=$1",[user]);
 assert.equal(feedback.length,1);
 assert.equal(feedback[0].resolveu,false);
 assert.match(feedback[0].atualizado_em,/2026-10-03/);
 await assert.rejects(db.query("UPDATE kb_artigos SET slug='outro-artigo' WHERE id=$1",[id]),/kb_artigos_categoria_slug/);
 // Rascunhos e artigos arquivados não geram redirecionamento para leitores.
 await db.query("UPDATE kb_artigos SET status='rascunho' WHERE id=$1",[id]);
 assert.equal((await q(db,SQL_RESOLVER_ALIAS_ARTIGO,[antiga,"leitor"])).length,0);
 assert.equal((await q(db,SQL_RESOLVER_ALIAS_ARTIGO,[antiga,"editor"])).length,1);
 await db.query("UPDATE kb_artigos SET arquivado=true WHERE id=$1",[id]);
 assert.equal((await q(db,SQL_RESOLVER_ALIAS_ARTIGO,[antiga,"editor"])).length,0);
 await db.query("UPDATE kb_artigos SET arquivado=false,status='revisado',slug='versao-a' WHERE id=$1",[id]);
 assert.equal((await q(db,SQL_RESOLVER_ALIAS_ARTIGO,[antiga,"leitor"])).length,0,
  "A URL atual não pode continuar cadastrada como alias");
 assert.equal((await q<{slug:string}>(db,SQL_RESOLVER_ALIAS_ARTIGO,[nova,"leitor"]))[0]?.slug,"versao-a");
 assert.equal((await q<{artigo_url:string}>(db,"SELECT artigo_url FROM kb_favoritos WHERE usuario_id=$1",[user]))[0].artigo_url,antiga);
 assert.equal((await q<{artigo_url:string}>(db,"SELECT artigo_url FROM kb_leituras WHERE usuario_id=$1",[user]))[0].artigo_url,antiga);
 assert.equal((await q<{artigo_url:string}>(db,"SELECT artigo_url FROM kb_artigo_feedback WHERE usuario_id=$1",[user]))[0].artigo_url,antiga);
});
