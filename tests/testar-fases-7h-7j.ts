import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {SQL_APAGAR_PARA_TODOS,SQL_APAGAR_PARA_MIM,SQL_INSERIR_IMAGEM_CHAT,SQL_LER_IMAGEM_CHAT} from "../src/lib/chat-sql";
import {termoEstatisticoSeguro} from "../src/lib/estatisticas-busca";
import {hojeISO,artigoPrecisaRevisao} from "../src/lib/apresentacao";

test("7H/7J: migração aditiva, avaliações por usuário e fila de exclusão física",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const nome of ["001_auth","002_painel","003_interacoes","006_chat","007_chat_acoes","008_chat_imagens","009_fases_7h_7j_feedback"])
  await db.exec(readFileSync("db/"+nome+".sql","utf8"));
 await db.exec(readFileSync("db/009_fases_7h_7j_feedback.sql","utf8"));
 const [a,b,terceiro]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [a,b,terceiro].entries())
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [id,"faseteste"+i,"Pessoa "+i,"a".repeat(32),"b".repeat(128)]);
 const url="/artigos/notas-fiscais/rejeicao-teste";
 const salvar=(u:string,resolveu:boolean)=>db.query(
  "INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu) VALUES($1,$2,$3) "+
  "ON CONFLICT(usuario_id,artigo_url) DO UPDATE SET resolveu=EXCLUDED.resolveu,atualizado_em=NOW()",[u,url,resolveu]);
 await salvar(a,true);await salvar(b,false);await salvar(b,true);
 const resumo=await db.query<{sim:number;nao:number}>("SELECT COUNT(*) FILTER(WHERE resolveu)::int AS sim,COUNT(*) FILTER(WHERE NOT resolveu)::int AS nao FROM kb_artigo_feedback WHERE artigo_url=$1",[url]);
 assert.equal(resumo.rows[0].sim,2);
 assert.equal(resumo.rows[0].nao,0);
 await assert.rejects(db.query("INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu) VALUES($1,$2,true)",[a,"https://segredo"]),/kb_artigo_feedback_artigo_url_check/);
 const conversa=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",[conversa,"dm:"+[a,b].sort().join(":")]);
 for(const u of [a,b])await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,u]);
 const imagem=`kb-chat-imagens/${randomUUID()}.png`;
 const enviada=await db.query<{id:number}>(SQL_INSERIR_IMAGEM_CHAT,[conversa,a,"📷 Imagem",null,imagem,"image/png",128]);
 const id=Number(enviada.rows[0].id);
 assert.equal((await db.query(SQL_LER_IMAGEM_CHAT,[b,id])).rows.length,1);
 await db.query(SQL_APAGAR_PARA_MIM,[b,id,conversa]);
 assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM kb_chat_imagens_limpeza")).rows[0]&&
  (await db.query<{n:number}>("SELECT COUNT(*)::int AS n FROM kb_chat_imagens_limpeza")).rows[0].n,0);
 assert.equal((await db.query(SQL_LER_IMAGEM_CHAT,[a,id])).rows.length,1);
 await db.query(SQL_APAGAR_PARA_TODOS,[terceiro,id,conversa]);
 assert.equal((await db.query<{n:number}>("SELECT COUNT(*)::int AS n FROM kb_chat_imagens_limpeza")).rows[0].n,0);
 await db.query(SQL_APAGAR_PARA_TODOS,[a,id,conversa]);
 const fila=await db.query<{caminho:string}>("SELECT caminho FROM kb_chat_imagens_limpeza");
 assert.equal(fila.rows.length,1);
 assert.equal(fila.rows[0].caminho,imagem);
 assert.equal((await db.query(SQL_LER_IMAGEM_CHAT,[a,id])).rows.length,0);
 await db.query(SQL_APAGAR_PARA_TODOS,[a,id,conversa]);
 assert.equal((await db.query("SELECT caminho FROM kb_chat_imagens_limpeza")).rows.length,1);
});
test("7J: registros agregados e filtro preventivo de termos sensíveis",async()=>{
 assert.equal(termoEstatisticoSeguro(" Rejeição Fiscal "), "rejeição fiscal");
 assert.equal(termoEstatisticoSeguro("Erro 539"),"erro 539");
 const casosInvalidos=[["123","456","789","01"].join(""),["11","999","888","777"].join(""),["email","@","empresa",".","com"].join(""),"https://exemplo.com","Documento "+["123","456","789"].join(" "),""];
 for(const valor of casosInvalidos)assert.equal(termoEstatisticoSeguro(valor),null);
 const db=new PGlite();
 try{
  for(const nome of ["001_auth","002_painel","003_interacoes","006_chat","007_chat_acoes","008_chat_imagens","009_fases_7h_7j_feedback"])
   await db.exec(readFileSync("db/"+nome+".sql","utf8"));
  const user=randomUUID();
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,'pesquisador','Pessoa', 'leitor',$2,$3)",
   [user,"a".repeat(32),"b".repeat(128)]);
  const sql=`WITH permitidos AS (
   INSERT INTO kb_busca_estatistica_limites(usuario_id,ultima_em) VALUES($1,NOW())
   ON CONFLICT(usuario_id) DO UPDATE SET ultima_em=NOW()
    WHERE kb_busca_estatistica_limites.ultima_em<NOW()-INTERVAL '15 seconds'
   RETURNING usuario_id
  ) INSERT INTO kb_buscas_sem_resultado(termo,dia,quantidade)
   SELECT $2,CURRENT_DATE,1 FROM permitidos
   ON CONFLICT(termo,dia) DO UPDATE SET quantidade=kb_buscas_sem_resultado.quantidade+1`;
  await db.query(sql,[user,"rejeição fiscal"]);
  await db.query(sql,[user,"rejeição fiscal"]);
  const rows=await db.query<{quantidade:number}>("SELECT quantidade FROM kb_buscas_sem_resultado WHERE termo='rejeição fiscal'");
  assert.equal(rows.rows[0].quantidade,1,"Rate limit impede contagem duplicada rápida");
 }finally{await db.close();}
});

test("7H: chat continua apagando antes da 009; migração retroage e trigger registra novos anexos",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const nome of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens"])
  await db.exec(readFileSync("db/"+nome+".sql","utf8"));
 const usuario=randomUUID(),conversa=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,'testecompat','Conta Teste','leitor',$2,$3)",
  [usuario,"a".repeat(32),"b".repeat(128)]);
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",[conversa,"compat-"+randomUUID()]);
 await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,usuario]);
 const inserir=async()=>{
  const caminho=`kb-chat-imagens/${randomUUID()}.png`;
  const r=await db.query<{id:number}>(SQL_INSERIR_IMAGEM_CHAT,[conversa,usuario,"Imagem",null,caminho,"image/png",250]);
  return {id:Number(r.rows[0].id),caminho};
 };
 const anterior=await inserir();
 assert.equal((await db.query(SQL_APAGAR_PARA_TODOS,[usuario,anterior.id,conversa])).rows.length,1);
 await db.exec(readFileSync("db/009_fases_7h_7j_feedback.sql","utf8"));
 const origem=await db.query<{caminho:string}>("SELECT caminho FROM kb_chat_imagens_limpeza");
 assert.deepEqual(origem.rows.map(x=>x.caminho),[anterior.caminho],"Migração captura apagamentos anteriores");
 const posterior=await inserir();
 assert.equal((await db.query(SQL_APAGAR_PARA_TODOS,[usuario,posterior.id,conversa])).rows.length,1);
 const fila=await db.query<{caminho:string}>("SELECT caminho FROM kb_chat_imagens_limpeza ORDER BY caminho");
 assert.deepEqual(fila.rows.map(x=>x.caminho),[anterior.caminho,posterior.caminho].sort());
 await db.exec(readFileSync("db/009_fases_7h_7j_feedback.sql","utf8"));
 assert.equal((await db.query<{total:number}>("SELECT COUNT(*)::int AS total FROM kb_chat_imagens_limpeza")).rows[0]?.total,2);
});

test("7J: revisão de artigos respeita o dia local de Araguaína",()=>{
 const antesDaMeiaNoite=new Date("2026-10-27T01:00:00.000Z");
 assert.equal(hojeISO(antesDaMeiaNoite),"2026-10-26");
 assert.equal(artigoPrecisaRevisao({revisarAte:"2026-10-26"},hojeISO(antesDaMeiaNoite)),false);
 assert.equal(artigoPrecisaRevisao({revisarAte:"2026-10-25"},hojeISO(antesDaMeiaNoite)),true);
 assert.equal(hojeISO(new Date("2026-10-27T03:15:00.000Z")),"2026-10-27");
});
test("7J: pesquisa longa não é truncada nem armazenada com parte descartada",()=>{
 assert.equal(termoEstatisticoSeguro("procedimento ".repeat(9)),null);
});
