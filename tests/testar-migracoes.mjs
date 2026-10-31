import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {randomUUID} from "node:crypto";
import {dividirInstrucoesSql} from "../scripts/migracoes-sql.mjs";

test("O parser mantém cada bloco PL/pgSQL e ignora BEGIN/COMMIT externos",()=>{
 const exemplo=`BEGIN;
 -- Comentário com ; e aspas
 DO $bloco$ BEGIN PERFORM 1; PERFORM 2; END $bloco$;
 INSERT INTO exemplo(valor) VALUES ('texto; com ponto e vírgula');
 COMMIT;`;
 const partes=dividirInstrucoesSql(exemplo);
 assert.equal(partes.length,2);
 assert.match(partes[0],/PERFORM 1; PERFORM 2;/);
 assert.match(partes[1],/texto; com ponto e vírgula/);
});

test("Todas as migrações são reaplicáveis em um Postgres isolado",async t=>{
 const banco=new PGlite();
 t.after(()=>banco.close());
 const arquivos=readdirSync("db").filter(x=>/^\d{3}_.+\.sql$/.test(x)).sort();
 assert.ok(arquivos.includes("010_perfis_notificacoes.sql"));
 assert.ok(arquivos.includes("011_chat_silenciar.sql"));
 assert.ok(arquivos.includes("012_chat_legenda_opcional.sql"));
 assert.ok(arquivos.includes("013_limites_retencao.sql"));
 assert.ok(arquivos.includes("014_ultimo_admin.sql"));
 assert.ok(arquivos.includes("015_recuperar_fila_imagens_chat.sql"));
 for(let rodada=0;rodada<2;rodada++){
  for(const arquivo of arquivos){
   const instrucoes=dividirInstrucoesSql(readFileSync("db/"+arquivo,"utf8"));
   assert.ok(instrucoes.length>0,arquivo);
   await banco.transaction(async tx=>{
    for(const instrucao of instrucoes)await tx.query(instrucao);
   });
  }
 }
 const tabelas=await banco.query("SELECT to_regclass('public.kb_avatar_limites') AS avatar, to_regclass('public.kb_busca_sugestoes_limites') AS busca");
 assert.equal(tabelas.rows[0].avatar,"kb_avatar_limites");
 assert.equal(tabelas.rows[0].busca,"kb_busca_sugestoes_limites");
});

test("Migração 015 restaura o gatilho 009 ausente e enfileira somente exclusão global",async context=>{
 const db=new PGlite();
 context.after(()=>db.close());
 const nomes=readdirSync("db").filter(x=>/^\\d{3}_.+\\.sql$/.test(x)).sort();
 for(const nome of nomes.filter(x=>!x.startsWith("015_"))){
  await db.transaction(async tx=>{
   for(const instrucao of dividirInstrucoesSql(readFileSync("db/"+nome,"utf8")))await tx.query(instrucao);
  });
 }
 await db.exec("DROP TRIGGER IF EXISTS kb_chat_imagem_exclusao_global ON kb_chat_mensagens; DROP FUNCTION IF EXISTS kb_registrar_imagem_chat_excluida();");
 const antes=await db.query("SELECT COUNT(*)::int AS total FROM pg_trigger WHERE tgname='kb_chat_imagem_exclusao_global' AND NOT tgisinternal");
 assert.equal(antes.rows[0].total,0);
 await db.transaction(async tx=>{
  for(const instrucao of dividirInstrucoesSql(readFileSync("db/015_recuperar_fila_imagens_chat.sql","utf8")))
   await tx.query(instrucao);
 });
 const usuario=randomUUID(),imagem=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,'testeusuario','Teste Usuário','leitor',$2,$3)",
  [usuario,"a".repeat(32),"b".repeat(128)]);
 const inserido=await db.query("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto,imagem_caminho,imagem_mime,imagem_tamanho) VALUES('00000000-0000-4000-8000-000000000001',$1,'Teste',$2,'image/png',100) RETURNING id",
  [usuario,`kb-chat-imagens/${imagem}.png`]);
 await db.query("UPDATE kb_chat_mensagens SET apagada_para_todos_em=NOW() WHERE id=$1",[inserido.rows[0].id]);
 const fila=await db.query("SELECT COUNT(*)::int AS total FROM kb_chat_imagens_limpeza");
 assert.equal(fila.rows[0].total,1);
 await db.query("UPDATE kb_chat_mensagens SET apagada_para_todos_em=NOW() WHERE id=$1",[inserido.rows[0].id]);
 assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM kb_chat_imagens_limpeza")).rows[0].total,1);
});
