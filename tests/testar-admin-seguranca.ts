import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";

test("O banco recusa desativar, rebaixar ou excluir o último administrador",async t=>{
 const db=new PGlite();
 t.after(()=>db.close());
 await db.exec(readFileSync("db/001_auth.sql","utf8"));
 const migracao=readFileSync("db/014_ultimo_admin.sql","utf8");
 await db.exec(migracao);
 await db.exec(migracao); // Idempotência: a trigger não deve duplicar.
 const [primeiro,segundo,leitor]=[randomUUID(),randomUUID(),randomUUID()];
 async function inserir(id:string,nome:string,papel:string){
  await db.query(`INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash)
    VALUES($1,$2,$3,$4,$5,$6)`,[id,nome,nome,papel,"a".repeat(32),"b".repeat(128)]);
 }
 await inserir(primeiro,"admin01","administrador");
 await inserir(leitor,"leitor01","leitor");
 await assert.rejects(db.query("UPDATE kb_usuarios SET ativo=false WHERE id=$1",[primeiro]),/último administrador/);
 await assert.rejects(db.query("UPDATE kb_usuarios SET papel='editor' WHERE id=$1",[primeiro]),/último administrador/);
 await assert.rejects(db.query("DELETE FROM kb_usuarios WHERE id=$1",[primeiro]),/último administrador/);
 await db.query("UPDATE kb_usuarios SET nome='Administrador Atualizado' WHERE id=$1",[primeiro]);
 await db.query("DELETE FROM kb_usuarios WHERE id=$1",[leitor]);
 await inserir(segundo,"admin02","administrador");
 await db.query("UPDATE kb_usuarios SET ativo=false WHERE id=$1",[primeiro]);
 await assert.rejects(db.query("UPDATE kb_usuarios SET papel='leitor' WHERE id=$1",[segundo]),/último administrador/);
 const atuais=await db.query<{total:number}>(`SELECT COUNT(*)::int AS total FROM kb_usuarios
  WHERE papel='administrador' AND ativo=true`);
 assert.equal(atuais.rows[0].total,1);
});
