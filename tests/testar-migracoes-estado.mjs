import assert from "node:assert/strict";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {dividirInstrucoesSql} from "../scripts/migracoes-sql.mjs";
import {SQL_INVENTARIO,listarManifesto,checarAssinatura,relatorioMigracoes} from "../scripts/migracoes-estado.mjs";

test("inventário identifica com segurança o banco vazio e os 14 arquivos aplicados manualmente",async t=>{
 const banco=new PGlite();
 t.after(()=>banco.close());
 const manifesto=listarManifesto();
 assert.equal(manifesto.length,14);
 const inicial=(await banco.query(SQL_INVENTARIO)).rows[0];
 assert.ok(relatorioMigracoes(manifesto,inicial).every(r=>r.situacao==="pendente"));
 for(const mig of manifesto){
  const comandos=dividirInstrucoesSql(mig.texto);
  await banco.transaction(async tx=>{for(const sql of comandos)await tx.query(sql);});
 }
 const inventario=(await banco.query(SQL_INVENTARIO)).rows[0];
 const estado=relatorioMigracoes(manifesto,inventario);
 assert.deepEqual(estado.map(x=>x.situacao),Array(14).fill("sem_historico"));
 assert.equal(checarAssinatura("014_ultimo_admin.sql",inventario).aplicada,true);
 const registrados=manifesto.map(({nome,checksum})=>({nome,checksum}));
 assert.ok(relatorioMigracoes(manifesto,inventario,registrados).every(x=>x.situacao==="registrada"));
 const comErro=[{nome:manifesto[0].nome,checksum:"0".repeat(64)}];
 assert.equal(relatorioMigracoes(manifesto,inventario,comErro)[0].situacao,"checksum_divergente");
});

test("assinatura incompleta ou trigger desabilitado impede reconciliação",async t=>{
 const banco=new PGlite();t.after(()=>banco.close());
 const manifesto=listarManifesto();
 for(const mig of manifesto){
  await banco.transaction(async tx=>{
   for(const sql of dividirInstrucoesSql(mig.texto))await tx.query(sql);
  });
 }
 await banco.exec("ALTER TABLE kb_usuarios DISABLE TRIGGER kb_usuarios_proteger_ultimo_admin");
 const inv=(await banco.query(SQL_INVENTARIO)).rows[0];
 const estado=relatorioMigracoes(manifesto,inv);
 assert.equal(estado.at(-1).situacao,"parcial");
 assert.ok(estado.at(-1).faltantes.some(x=>x.includes("kb_usuarios_proteger_ultimo_admin")));
});
