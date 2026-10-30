import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {SQL_LISTAR_NOTIFICACOES,SQL_CONTAR_NOTIFICACOES,SQL_MARCAR_NOTIFICACOES,SQL_MARCAR_NOTIFICACOES_CONVERSA,NOTIFICACAO_ID} from "../src/lib/notificacoes-sql";

test("Fase 8: migração idempotente, notificação privada e preferências por usuário",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 await db.exec(readFileSync("db/010_perfis_notificacoes.sql","utf8"));
 const pessoas=[randomUUID(),randomUUID(),randomUUID()];
 for(let i=0;i<pessoas.length;i++)await db.query(
  "INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
  [pessoas[i],"usrfase8"+i,"Pessoa Teste "+i,"a".repeat(32),"b".repeat(128)]);
 const [a,b,c]=pessoas;const conversa=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",[conversa,"dm:"+[a,b].sort().join(":")]);
 for(const id of [a,b])await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,id]);
 const gravada=await db.query<{id:number}>("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,'teste') RETURNING id",[conversa,a]);
 const id=gravada.rows[0].id;
 const avisos=await db.query<{destinatario_id:string;autor_id:string;mensagem_id:number}>("SELECT destinatario_id,autor_id,mensagem_id FROM kb_notificacoes");
 assert.equal(avisos.rows.length,1);assert.equal(avisos.rows[0].destinatario_id,b);assert.equal(avisos.rows[0].autor_id,a);assert.equal(Number(avisos.rows[0].mensagem_id),Number(id));
 assert.ok(!avisos.rows.some(x=>x.destinatario_id===c));
 await db.query("UPDATE kb_usuarios SET bio=$2,preferencias_notificacoes=$3::jsonb WHERE id=$1",
  [b,"Suporte ERP",JSON.stringify({avisos:false,navegador:false,geral:true})]);
 const prefs=await db.query<{bio:string;avisos:boolean}>(
  "SELECT bio,(preferencias_notificacoes->>'avisos')::boolean AS avisos FROM kb_usuarios WHERE id=$1",[b]);
 assert.equal(prefs.rows[0].bio,"Suporte ERP");assert.equal(prefs.rows[0].avisos,false);
 await db.query("UPDATE kb_notificacoes SET vista_em=NOW() WHERE destinatario_id=$1 AND mensagem_id=$2",[b,id]);
 assert.equal((await db.query<{c:number}>("SELECT COUNT(*)::int AS c FROM kb_notificacoes WHERE destinatario_id=$1 AND vista_em IS NULL",[b])).rows[0].c,0);
});
test("Fase 8: UI não expõe texto privado nas notificações",()=>{
 const codigo=readFileSync("src/components/central-notificacoes.tsx","utf8");
 assert.match(codigo,/\/api\/notificacoes/);
 assert.match(codigo,/Nova mensagem/);
 assert.doesNotMatch(codigo,/n\.texto|message\.text/);
 const layout=readFileSync("src/components/estrutura-aplicacao.tsx","utf8");
 assert.match(layout,/CentralNotificacoes/);
 const css=readFileSync("src/app/globals.css","utf8");
 assert.match(css,/prefers-reduced-motion/);
});

test("Fase 8: contador completo, mensagens ocultas e leitura da conversa sem vazar avisos",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 const [autor,destinatario,terceiro]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [autor,destinatario,terceiro].entries())
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [id,"testnotif"+i,"Colaborador "+i,"a".repeat(32),"b".repeat(128)]);
 const conversa=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",
  [conversa,"dm:"+[autor,destinatario].sort().join(":")]);
 for(const id of [autor,destinatario])
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,id]);
 for(let i=0;i<45;i++)await db.query(
  "INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,$3)",[conversa,autor,"Aviso "+i]);
 const lista=await db.query<{id:string;conversaId:string}>(SQL_LISTAR_NOTIFICACOES,[destinatario]);
 const total=await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario]);
 assert.equal(lista.rows.length,40,"Painel mostra apenas últimas 40 mensagens");
 assert.equal(total.rows[0].total,45,"Contador considera todas as mensagens");
 assert.ok(lista.rows.every(item=>typeof item.id==="string"&&NOTIFICACAO_ID.test(item.id)));
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[terceiro])).rows[0].total,0);
 const primeiro=lista.rows[0].id;
 await db.query(SQL_MARCAR_NOTIFICACOES,[destinatario,[primeiro]]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,44);
 await db.query(SQL_MARCAR_NOTIFICACOES_CONVERSA,[destinatario,conversa]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,0);
 await db.query("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,'Oculta')",[conversa,autor]);
 const ultima=await db.query<{id:number}>("SELECT id FROM kb_chat_mensagens ORDER BY id DESC LIMIT 1");
 await db.query("INSERT INTO kb_chat_mensagens_ocultas(usuario_id,mensagem_id) VALUES($1,$2)",[destinatario,ultima.rows[0].id]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,0,
  "Mensagem ocultada não permanece no contador");
});
