import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {maisRecente} from "../src/lib/notificacoes-client";
import {atualizarHistorico,mensagensIguais} from "../src/lib/chat-estado-mensagens";
import type {MensagemChat} from "../src/lib/chat-tipos";
import {SQL_MARCAR_LIDA_VISIVEL,SQL_TOTAL_NAO_LIDAS} from "../src/lib/chat-sql";
import {SQL_LISTAR_NOTIFICACOES,SQL_CONTAR_NOTIFICACOES,SQL_MARCAR_NOTIFICACOES,SQL_MARCAR_NOTIFICACOES_CONVERSA,SQL_MARCAR_NOTIFICACOES_ATE,SQL_REMOVER_PUSH_EXPIRADO,NOTIFICACAO_ID} from "../src/lib/notificacoes-sql";

test("Fase 8: migração idempotente, notificação privada e preferências por usuário",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
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

test("Fase 8: Web Push reassocia dispositivo sem enviar avisos a contas antigas",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 const primeiro=randomUUID(),segundo=randomUUID();
 for(const [i,id] of [primeiro,segundo].entries())
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [id,"pushfase8"+i,"Pessoa Push "+i,"a".repeat(32),"b".repeat(128)]);
 const endpoint="https://fcm.googleapis.com/fcm/send/"+"z".repeat(64);
 const hash="f".repeat(64);
 const sql=`INSERT INTO kb_push_subscricoes(usuario_id,endpoint_hash,endpoint)
  VALUES($1,$2,$3) ON CONFLICT(endpoint_hash) DO UPDATE
  SET usuario_id=EXCLUDED.usuario_id,endpoint=EXCLUDED.endpoint,criado_em=NOW()`;
 await db.query(sql,[primeiro,hash,endpoint]);
 await db.query(sql,[segundo,hash,endpoint]);
 const rows=await db.query<{usuario_id:string}>("SELECT usuario_id FROM kb_push_subscricoes WHERE endpoint_hash=$1",[hash]);
 assert.equal(rows.rows.length,1,"Dispositivo tem um único proprietário");
 assert.equal(rows.rows[0].usuario_id,segundo,"A conta atual assume o dispositivo");
 // Um envio iniciado na conta antiga pode receber 410 depois da reassociação.
 const posReassociacao=await db.query<{usuario_id:string;criado_em:string;endpoint:string}>(
  "SELECT usuario_id,criado_em::text AS criado_em,endpoint FROM kb_push_subscricoes WHERE endpoint_hash=$1",[hash]);
 await db.query(SQL_REMOVER_PUSH_EXPIRADO,[hash,endpoint,primeiro,posReassociacao.rows[0].criado_em]);
 assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM kb_push_subscricoes WHERE usuario_id=$1",[segundo])).rows[0].total,1,
  "Retorno 410 de outra conta não pode excluir a inscrição reassociada");
 await db.query(SQL_REMOVER_PUSH_EXPIRADO,[hash,endpoint,segundo,posReassociacao.rows[0].criado_em]);
 assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM kb_push_subscricoes WHERE endpoint_hash=$1",[hash])).rows[0].total,0,
  "Endpoint expirado ainda associado ao mesmo registro pode ser removido");
});

test("Fase 8: contador completo, mensagens ocultas e leitura da conversa sem vazar avisos",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
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

test("Fase 8: comparação de IDs grandes não perde precisão",()=>{
 assert.equal(maisRecente("9007199254740993","9007199254740992"),true);
 assert.equal(maisRecente("9007199254740992","9007199254740993"),false);
 assert.equal(maisRecente("100","99"),true);
 assert.equal(maisRecente("99","100"),false);
});

test("Fase 8: preferência do canal geral filtra avisos sem afetar mensagens",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 const autor=randomUUID(),destino=randomUUID();
 for(const [i,id] of [autor,destino].entries())await db.query(
  "INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
  [id,"geralfase8"+i,"Pessoa Geral "+i,"a".repeat(32),"b".repeat(128)]);
 const conversa="00000000-0000-4000-8000-000000000001";
 for(const id of [autor,destino])
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,id]);
 await db.query("UPDATE kb_usuarios SET preferencias_notificacoes=$2::jsonb WHERE id=$1",[
  destino,JSON.stringify({avisos:true,geral:false,navegador:false})]);
 await db.query("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,'Canal geral')",[conversa,autor]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destino])).rows[0].total,0);
 assert.equal((await db.query(SQL_LISTAR_NOTIFICACOES,[destino])).rows.length,0);
 await db.query("UPDATE kb_usuarios SET preferencias_notificacoes=$2::jsonb WHERE id=$1",[
  destino,JSON.stringify({avisos:true,geral:true,navegador:false})]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destino])).rows[0].total,1);
});

test("Fase 8: silenciar conversa só afeta os alertas do próprio participante",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 await db.exec(readFileSync("db/011_chat_silenciar.sql","utf8"));
 const [autor,primeiro,segundo]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [autor,primeiro,segundo].entries())
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [id,"silenciofase8"+i,"Pessoa "+i,"a".repeat(32),"b".repeat(128)]);
 const geral="00000000-0000-4000-8000-000000000001";
 for(const id of [autor,primeiro,segundo])
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[geral,id]);
 await db.query("UPDATE kb_chat_participantes SET silenciada=true WHERE usuario_id=$1 AND conversa_id=$2",[primeiro,geral]);
 await db.query("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,'Novo aviso')",[geral,autor]);
 const count=async(usuario:string)=>(await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[usuario])).rows[0].total;
 assert.equal(await count(primeiro),0,"A conta silenciada não recebe alerta");
 assert.equal(await count(segundo),1,"O colega continua recebendo alerta");
 assert.equal((await db.query<{total:number}>("SELECT COUNT(*)::int AS total FROM kb_chat_mensagens WHERE conversa_id=$1",[geral])).rows[0].total,1,"Mensagem não foi apagada");
 await db.query("UPDATE kb_chat_participantes SET silenciada=false WHERE usuario_id=$1 AND conversa_id=$2",[primeiro,geral]);
 assert.equal(await count(primeiro),1,"Reativação restaura o acesso ao histórico de avisos");
});

test("Fase 8: leitura só confirma IDs realmente recebidos pelo cliente",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const file of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens","010_perfis_notificacoes","011_chat_silenciar"])
  await db.exec(readFileSync("db/"+file+".sql","utf8"));
 const [autor,destinatario,intruso]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [autor,destinatario,intruso].entries())
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES($1,$2,$3,'leitor',$4,$5)",
   [id,"leiturafase8"+i,"Leitura "+i,"a".repeat(32),"b".repeat(128)]);
 const conversa=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",
  [conversa,"dm:"+[autor,destinatario].sort().join(":")]);
 for(const id of [autor,destinatario])
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[conversa,id]);
 const enviar=async(texto:string)=>{
  const res=await db.query<{id:number}>("INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) VALUES($1,$2,$3) RETURNING id",
   [conversa,autor,texto]);
  return res.rows[0].id;
 };
 const primeiro=await enviar("Recebida primeiro");
 const segundo=await enviar("Recebida depois");
 const terceiro=await enviar("Chegou durante a consulta");
 const confirmar=async(id:number,usuario=destinatario)=>{
  const resultado=await db.query<{existe:boolean;alterou:boolean}>(SQL_MARCAR_LIDA_VISIVEL,[conversa,usuario,id]);
  if(resultado.rows[0]?.existe)await db.query(SQL_MARCAR_NOTIFICACOES_ATE,[usuario,conversa,id]);
  return resultado.rows[0];
 };
 assert.equal((await confirmar(primeiro)).alterou,true);
 assert.equal((await db.query<{total:number}>(SQL_TOTAL_NAO_LIDAS,[destinatario])).rows[0].total,2);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,2);
 assert.equal((await confirmar(primeiro)).alterou,false,"Confirmação repetida não atualiza leitura");
 assert.equal((await confirmar(terceiro,intruso)).existe,false,"Terceiro não recebe acesso à conversa");
 const quarto=await enviar("Mensagem chegou após a resposta");
 assert.ok(quarto>terceiro&&terceiro>segundo);
 await confirmar(terceiro);
 assert.equal((await db.query<{total:number}>(SQL_TOTAL_NAO_LIDAS,[destinatario])).rows[0].total,1);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,1,
  "Nova mensagem não deve ser marcada como vista pelo ACK anterior");
 const marcador=await db.query<{ultima_lida_id:number}>(
  "SELECT ultima_lida_id FROM kb_chat_participantes WHERE usuario_id=$1 AND conversa_id=$2",[destinatario,conversa]);
 assert.equal(Number(marcador.rows[0].ultima_lida_id),terceiro);
 // Um cliente com ID futuro não deve confirmar notificações que o banco não marcou como lidas.
 await db.query(SQL_MARCAR_NOTIFICACOES_ATE,[destinatario,conversa,Number.MAX_SAFE_INTEGER]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,1,
  "Aviso posterior ao marcador de leitura permanece não lido");

 // Corrida entre o ACK de um cliente e uma nova mensagem recebida.
 await confirmar(Number.MAX_SAFE_INTEGER);
 const quinto=await enviar("Chegou durante a sincronização de avisos");
 assert.ok(quinto>quarto);
 await db.query(SQL_MARCAR_NOTIFICACOES_ATE,[destinatario,conversa,Number.MAX_SAFE_INTEGER]);
 assert.equal((await db.query<{total:number}>(SQL_CONTAR_NOTIFICACOES,[destinatario])).rows[0].total,1,
  "O ACK antigo não deve marcar uma mensagem chegada depois");
 const leitura=await db.query<{ultima_lida_id:number}>(
  "SELECT ultima_lida_id FROM kb_chat_participantes WHERE usuario_id=$1 AND conversa_id=$2",[destinatario,conversa]);
 assert.equal(Number(leitura.rows[0].ultima_lida_id),quarto);
});

test("Fase 8: polling do chat preserva referência e não redesenha mensagens inalteradas",()=>{
 const msg=(id:number,complemento:Partial<MensagemChat>={}):MensagemChat=>({
  id,conversaId:"00000000-0000-4000-8000-000000000001",autorId:"00000000-0000-4000-8000-000000000002",
  autor:"Colaborador",texto:"Mensagem "+id,criadoEm:"2026-10-31T10:00:00.000Z",
  apagadaParaTodos:false,temImagem:false,respondendoAId:null,respostaA:null,...complemento
 });
 const mensagens=[msg(5),msg(6)];
 const recarregadas=[msg(5),msg(6)];
 assert.equal(mensagensIguais(mensagens,recarregadas),true);
 assert.strictEqual(atualizarHistorico(mensagens,recarregadas,null),mensagens,
  "Mesmo conteúdo precisa preservar a referência para evitar renderização");
 const alteradas=[msg(5,{apagadaParaTodos:true,texto:"[Mensagem apagada]"}),msg(6)];
 assert.notStrictEqual(atualizarHistorico(mensagens,alteradas,null),mensagens);
 const antigas=[msg(3),msg(4),msg(5)];
 const paginadas=atualizarHistorico(mensagens,antigas,5);
 assert.deepEqual(paginadas.map(x=>x.id),[3,4,5,6],"Paginação não pode duplicar ID");
 assert.strictEqual(atualizarHistorico(paginadas,antigas,5),paginadas,
  "Uma página já carregada não deve redesenhar todo o histórico");
 const respostaNova=[msg(5,{respostaA:{id:2,autor:"Outro",texto:"Alterado"}}),msg(6)];
 assert.equal(mensagensIguais(mensagens,respostaNova),false,"Atualização de resposta precisa atualizar UI");
});

