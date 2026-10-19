import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {CHAT_GERAL_ID} from "../src/lib/chat-tipos";
test("7G: schema idempotente e privacidade entre participantes",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const nome of ["001_auth","002_painel","006_chat"])await db.exec(readFileSync("db/"+nome+".sql","utf8"));
 await db.exec(readFileSync("db/006_chat.sql","utf8"));
 const ids=[randomUUID(),randomUUID(),randomUUID()];
 for(let i=0;i<ids.length;i++)await db.query(
   "INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [ids[i],"chat"+i,"Pessoa "+i,"a".repeat(32),"b".repeat(128)]);
 const geral=await db.query<{id:string}>("SELECT id FROM kb_chat_conversas WHERE chave='geral'");
 assert.equal(geral.rows[0].id,CHAT_GERAL_ID);assert.equal(geral.rows.length,1);
 const [a,b,terceiro]=ids;const chave="dm:"+[a,b].sort().join(":");
 const conversa=await db.query<{id:string}>(
   "WITH pessoa AS (SELECT id FROM kb_usuarios WHERE id=$2 AND ativo=true AND id<>$1), "+
   "nova AS (INSERT INTO kb_chat_conversas(tipo,chave,criado_por) "+
   "SELECT 'privada',$3,$1 FROM pessoa ON CONFLICT(chave) DO UPDATE SET chave=EXCLUDED.chave RETURNING id), "+
   "partes AS (INSERT INTO kb_chat_participantes(conversa_id,usuario_id) "+
   "SELECT nova.id,ids.id FROM nova CROSS JOIN (SELECT $1::uuid AS id UNION SELECT $2::uuid AS id) ids "+
   "WHERE true ON CONFLICT DO NOTHING RETURNING conversa_id) SELECT id FROM nova",[a,b,chave]);
 assert.equal(conversa.rows.length,1);const id=conversa.rows[0].id;
 const participantes=await db.query<{usuario_id:string}>(
   "SELECT usuario_id FROM kb_chat_participantes WHERE conversa_id=$1",[id]);
 assert.deepEqual(participantes.rows.map(x=>x.usuario_id).sort(),[a,b].sort());
 const escrita=async(user:string)=>db.query(
  "INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) "+
  "SELECT $1,$2,$3 WHERE EXISTS(SELECT 1 FROM kb_chat_participantes WHERE conversa_id=$1 AND usuario_id=$2) RETURNING id",
  [id,user,"Teste privado"]);
 assert.equal((await escrita(a)).rows.length,1);assert.equal((await escrita(terceiro)).rows.length,0);
 const leitura=async(user:string)=>db.query(
  "SELECT m.id FROM kb_chat_mensagens m JOIN kb_chat_participantes p "+
  "ON p.conversa_id=m.conversa_id AND p.usuario_id=$1 WHERE m.conversa_id=$2",[user,id]);
 assert.equal((await leitura(b)).rows.length,1);assert.equal((await leitura(terceiro)).rows.length,0);
});
