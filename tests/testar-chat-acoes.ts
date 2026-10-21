import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {
 SQL_CONVERSAS,SQL_LISTAR_MENSAGENS,SQL_INSERIR_MENSAGEM,
 SQL_APAGAR_PARA_MIM,SQL_APAGAR_PARA_TODOS,SQL_LIMPAR_CONVERSA,
 SQL_TOTAL_NAO_LIDAS
} from "../src/lib/chat-sql";

type Linha={id:number;texto:string;respondendo_a_id:number|null;
 resposta_texto:string|null;apagada_para_todos:boolean;nao_lidas:number;ultima_mensagem:string|null};

test("7G.3: ações preservam privacidade por participante e mantêm integridade",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 for(const item of ["001_auth","002_painel","006_chat","007_chat_acoes","008_chat_imagens"]){
  await db.exec(readFileSync("db/"+item+".sql","utf8"));
 }
 // Migration 007 pode ser repetida após implantação.
 await db.exec(readFileSync("db/007_chat_acoes.sql","utf8"));
 const [a,b,terceiro]=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of [a,b,terceiro].entries()){
  await db.query("INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) "+
    "VALUES ($1,$2,$3,'leitor',$4,$5)",[id,"teste"+i,"Colaborador "+i,"a".repeat(32),"b".repeat(128)]);
 }
 const dm=randomUUID();
 await db.query("INSERT INTO kb_chat_conversas(id,tipo,chave) VALUES($1,'privada',$2)",[dm,"dm:"+[a,b].sort().join(":")]);
 for(const id of [a,b]){
  await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[dm,id]);
 }
 const escrever=async (usuario:string,texto:string,resposta:number|null=null)=>{
  const r=await db.query<Linha>(SQL_INSERIR_MENSAGEM,[dm,usuario,texto,resposta]);
  return r.rows[0];
 };
 const listar=async(usuario:string,conversa=dm)=>{
  const r=await db.query<Linha>(SQL_LISTAR_MENSAGENS,[usuario,conversa,null,""]);
  return r.rows;
 };
 const primeira=await escrever(a,"Conteúdo secreto original 123");
 assert.ok(primeira?.id>0);
 const citada=await escrever(b,"Resposta ao primeiro",primeira.id);
 assert.equal(Number(citada.respondendo_a_id),Number(primeira.id));
 let linhas=await listar(b);
 assert.equal(linhas.length,2);
 assert.equal(linhas.find(m=>Number(m.id)===Number(citada.id))?.resposta_texto,"Conteúdo secreto original 123");
 assert.equal((await listar(terceiro)).length,0);
 const invalida=await db.query(SQL_INSERIR_MENSAGEM,[dm,terceiro,"Não autorizada",null]);
 assert.equal(invalida.rows.length,0);
 const geral="00000000-0000-4000-8000-000000000001";
 await db.query("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2)",[geral,a]);
 const mensagemGeral=await db.query<Linha>(SQL_INSERIR_MENSAGEM,[geral,a,"Apenas geral",null]);
 const cruzada=await db.query(SQL_INSERIR_MENSAGEM,[dm,a,"Resposta inválida",mensagemGeral.rows[0].id]);
 assert.equal(cruzada.rows.length,0,"Não pode responder uma mensagem de outra conversa");
 const negarApagar=await db.query(SQL_APAGAR_PARA_TODOS,[b,primeira.id,dm]);
 assert.equal(negarApagar.rows.length,0,"Outro participante não pode apagar para todos");
 const intruso=await db.query(SQL_APAGAR_PARA_TODOS,[terceiro,primeira.id,dm]);
 assert.equal(intruso.rows.length,0);
 const ocultou=await db.query(SQL_APAGAR_PARA_MIM,[b,primeira.id,dm]);
 assert.equal(ocultou.rows.length,1);
 assert.equal((await listar(b)).length,1,"A mensagem some apenas para quem ocultou");
 assert.equal((await listar(a)).length,2,"O autor continua vendo a mensagem");
 linhas=await listar(b);
 assert.equal(linhas[0].resposta_texto,"[Mensagem indisponível]","Citação não revela texto ocultado");
 const citarOculta=await db.query(SQL_INSERIR_MENSAGEM,[dm,b,"Não pode citar ocultada",primeira.id]);
 assert.equal(citarOculta.rows.length,0);
 const global=await db.query(SQL_APAGAR_PARA_TODOS,[a,primeira.id,dm]);
 assert.equal(global.rows.length,1);
 const atual=await db.query<{texto:string;apagada_para_todos_em:string|null}>(
  "SELECT texto,apagada_para_todos_em::text AS apagada_para_todos_em FROM kb_chat_mensagens WHERE id=$1",
  [primeira.id]);
 assert.equal(atual.rows[0].texto,"[Mensagem apagada]");
 assert.ok(atual.rows[0].apagada_para_todos_em);
 assert.equal((await listar(a)).find(m=>Number(m.id)===Number(primeira.id))?.apagada_para_todos,true);
 const naoPodeRepetir=await db.query(SQL_APAGAR_PARA_TODOS,[a,primeira.id,dm]);
 assert.equal(naoPodeRepetir.rows.length,0);
 const citarApagada=await db.query(SQL_INSERIR_MENSAGEM,[dm,a,"Não pode citar apagada",primeira.id]);
 assert.equal(citarApagada.rows.length,0);
 const totais=await db.query<{total:number}>(SQL_TOTAL_NAO_LIDAS,[a]);
 assert.equal(totais.rows[0].total,1,"Mensagens próprias ou excluídas globalmente não contam");
 const limpar=await db.query(SQL_LIMPAR_CONVERSA,[dm,b]);
 assert.equal(limpar.rows.length,1);
 assert.equal((await listar(b)).length,0);
 assert.equal((await listar(a)).length,2);
 const previewsB=await db.query<{id:string;ultima_mensagem:string|null}>(SQL_CONVERSAS,[b]);
 assert.equal(previewsB.rows.find(m=>m.id===dm)?.ultima_mensagem,null,"Limpar remove prévia apenas para a conta");
 const previewsA=await db.query<{id:string;ultima_mensagem:string|null}>(SQL_CONVERSAS,[a]);
 assert.ok(previewsA.rows.find(m=>m.id===dm)?.ultima_mensagem,"Outros mantêm sua prévia");
 const depois=await escrever(a,"Nova mensagem depois de limpar");
 assert.equal((await listar(b)).length,1);
 assert.equal((await listar(b))[0].texto,depois.texto);
 const reaproveitar=await db.query(SQL_INSERIR_MENSAGEM,[dm,b,"Resposta a mensagem limpa",citada.id]);
 assert.equal(reaproveitar.rows.length,0,"Não pode citar histórico já limpo");
 const contagem=await db.query<{total:number}>(SQL_TOTAL_NAO_LIDAS,[b]);
 assert.equal(contagem.rows[0].total,1,"Após limpar, só mensagens novas entram na contagem");
});
