import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
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
