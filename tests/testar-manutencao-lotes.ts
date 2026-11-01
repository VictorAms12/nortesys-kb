import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { dividirInstrucoesSql } from "../scripts/migracoes-sql.mjs";
import { SQL_LIMPAR_TEMPORARIOS, SQL_LIMPAR_NOTIFICACOES, SQL_LIMPAR_COTAS_AVATAR, SQL_LIMPAR_COTAS_BUSCA, LOTE_MANUTENCAO } from "../src/lib/manutencao-sql";

const hash="a".repeat(128),salt="b".repeat(32);
async function usuario(db:PGlite,login:string) {
 const id=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES ($1,$2,$3,'leitor',$4,$5)",
  [id,login,login,salt,hash]);
 return id;
}

test("sessões e tentativas expiradas são removidas em lotes sem afetar registros válidos",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(readFileSync("db/001_auth.sql","utf8"));
 const id=await usuario(db,"usuarioum");
 await db.query(`INSERT INTO kb_sessoes(token_hash,usuario_id,versao_sessao,expira_em)
  SELECT lpad(to_hex(g),64,'0'),$1,1,NOW()-INTERVAL '1 day' FROM generate_series(1,205) g`,[id]);
 await db.query(`INSERT INTO kb_sessoes(token_hash,usuario_id,versao_sessao,expira_em)
  VALUES ($1,$2,1,NOW()+INTERVAL '1 day')`,["f".repeat(64),id]);
 await db.exec(`INSERT INTO kb_login_tentativas(chave,quantidade,expira_em)
  SELECT 'usuario'||g,1,NOW()-INTERVAL '1 day' FROM generate_series(1,205) g`);
 await db.exec(`INSERT INTO kb_login_tentativas(chave,quantidade,expira_em)
  VALUES ('ativo',1,NOW()+INTERVAL '1 day')`);
 const a=await db.query<{total:number}>(SQL_LIMPAR_TEMPORARIOS,[LOTE_MANUTENCAO]);
 const b=await db.query<{total:number}>(SQL_LIMPAR_TEMPORARIOS,[LOTE_MANUTENCAO]);
 assert.equal(a.rows[0].total,400);
 assert.equal(b.rows[0].total,10);
 const contagem=await db.query<{sessoes:number;tentativas:number}>(`
  SELECT (SELECT COUNT(*)::int FROM kb_sessoes) AS sessoes,
         (SELECT COUNT(*)::int FROM kb_login_tentativas) AS tentativas`);
 assert.deepEqual(contagem.rows[0],{sessoes:1,tentativas:1});
});

test("notificações vencidas e cotas são limpas por lote e preservam itens recentes",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 const arquivos=readdirSync("db").filter(x=>/^\d{3}_.+\.sql$/.test(x)).sort();
 for(const nome of arquivos){
  await db.transaction(async tx=>{
   for(const sql of dividirInstrucoesSql(readFileSync("db/"+nome,"utf8")))await tx.query(sql);
  });
 }
 const autor=await usuario(db,"autor01"),destinatario=await usuario(db,"destino01");
 await db.query(`INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto)
  SELECT '00000000-0000-4000-8000-000000000001',$1,'Teste' FROM generate_series(1,205)`,[autor]);
 await db.query(`INSERT INTO kb_notificacoes(destinatario_id,autor_id,conversa_id,mensagem_id,criada_em)
  SELECT $1,$2,'00000000-0000-4000-8000-000000000001',id,NOW()-INTERVAL '40 days' FROM kb_chat_mensagens`,[destinatario,autor]);
 const antigos=await db.query<{total:number}>(SQL_LIMPAR_NOTIFICACOES,[30,LOTE_MANUTENCAO]);
 const restantes=await db.query<{total:number}>(SQL_LIMPAR_NOTIFICACOES,[30,LOTE_MANUTENCAO]);
 assert.equal(antigos.rows[0].total,200);
 assert.equal(restantes.rows[0].total,5);
 await db.query(`INSERT INTO kb_avatar_limites(usuario_id,janela_em,quantidade) VALUES($1,NOW()-INTERVAL '2 days',1)`,[autor]);
 await db.query(`INSERT INTO kb_busca_sugestoes_limites(usuario_id,janela_em,quantidade) VALUES($1,NOW()-INTERVAL '2 days',1)`,[autor]);
 await db.query(`INSERT INTO kb_avatar_limites(usuario_id,janela_em,quantidade) VALUES($1,NOW(),1)`,[destinatario]);
 assert.equal((await db.query<{total:number}>(SQL_LIMPAR_COTAS_AVATAR,[LOTE_MANUTENCAO])).rows[0].total,1);
 assert.equal((await db.query<{total:number}>(SQL_LIMPAR_COTAS_BUSCA,[LOTE_MANUTENCAO])).rows[0].total,1);
 assert.equal((await db.query<{total:number}>("SELECT COUNT(*)::int AS total FROM kb_avatar_limites")).rows[0].total,1);
});
