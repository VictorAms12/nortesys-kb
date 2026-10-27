import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {SQL_APAGAR_PARA_MIM,SQL_APAGAR_PARA_TODOS,SQL_INSERIR_IMAGEM_CHAT,
 SQL_LER_IMAGEM_CHAT,SQL_LISTAR_MENSAGENS,SQL_LIMPAR_CONVERSA} from "../src/lib/chat-sql";

test("8: imagens privadas, migração idempotente e autorização individual",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const n of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","009_fases_7h_7j_feedback"])
  await db.exec(readFileSync(`db/${n}.sql`,"utf8"));
 await db.exec(readFileSync("db/008_chat_imagens.sql","utf8"));
 const [autor,receptor,intruso]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [autor,receptor,intruso].entries()){
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) "+
   "VALUES($1,$2,$3,'leitor',$4,$5)",[id,"imageuser"+i,"Pessoa "+i,"a".repeat(32),"b".repeat(128)]);
 }
 const conversa=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",
  [conversa,"dm:"+[autor,receptor].sort().join(":")]);
 for(const id of [autor,receptor])
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,id]);
 const caminho=`kb-chat-imagens/${randomUUID()}.png`;
 const inserir=(usuario:string,arquivo=caminho)=>db.query<{id:number;texto:string}>(
  SQL_INSERIR_IMAGEM_CHAT,[conversa,usuario,"📷 Imagem",null,arquivo,"image/png",350]);
 assert.equal((await inserir(intruso)).rows.length,0,"Não participante não pode enviar imagem");
 const envio=await inserir(autor);
 assert.equal(envio.rows.length,1);
 const id=Number(envio.rows[0].id);
 const ler=(usuario:string)=>db.query<{imagem_caminho:string}>(SQL_LER_IMAGEM_CHAT,[usuario,id]);
 assert.equal((await ler(autor)).rows[0].imagem_caminho,caminho);
 assert.equal((await ler(receptor)).rows[0].imagem_caminho,caminho);
 assert.equal((await ler(intruso)).rows.length,0,"Usuário de fora não lê imagem privada");
 const lista=await db.query<{tem_imagem:boolean}>(SQL_LISTAR_MENSAGENS,[receptor,conversa,null,""]);
 assert.equal(lista.rows[0].tem_imagem,true);
 await assert.rejects(inserir(autor,"kb-chat-imagens/../../segredo.png"),/kb_chat_imagem_valida/);
 await assert.rejects(inserir(autor,caminho),/kb_chat_imagem_caminho_unique/);
 await db.query(SQL_APAGAR_PARA_MIM,[receptor,id,conversa]);
 assert.equal((await ler(receptor)).rows.length,0,"Apagar para mim também revoga leitura");
 assert.equal((await ler(autor)).rows.length,1,"Apagar para mim não afeta o autor");
 await db.query(SQL_LIMPAR_CONVERSA,[conversa,autor]);
 assert.equal((await ler(autor)).rows.length,0,"Limpar conversa revoga imagens anteriores");
 const caminhoNovo=`kb-chat-imagens/${randomUUID()}.webp`;
 const novo=await db.query<{id:number}>(SQL_INSERIR_IMAGEM_CHAT,
  [conversa,autor,"Foto",null,caminhoNovo,"image/webp",99]);
 const novoId=Number(novo.rows[0].id);
 assert.equal((await db.query(SQL_LER_IMAGEM_CHAT,[receptor,novoId])).rows.length,1);
 await db.query(SQL_APAGAR_PARA_TODOS,[autor,novoId,conversa]);
 assert.equal((await db.query(SQL_LER_IMAGEM_CHAT,[receptor,novoId])).rows.length,0,
  "Apagar para todos revoga leitura mesmo com URL antiga");
});
