import assert from "node:assert/strict";
import {randomBytes,scryptSync,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {PGlite} from "@electric-sql/pglite";
import {criarConferenciaCredenciais,gerarHashVersionado,parametrosHashVersionado,verificarHashVersionado} from "../src/lib/usuarios";

test("scrypt legado faz rehash sem revogar sessão; scrypt novo entra e parâmetros inválidos falham",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(readFileSync("db/001_auth.sql","utf8"));
 await db.exec(readFileSync("db/019_scrypt_versionado.sql","utf8"));
 const id=randomUUID(),sal=randomBytes(16),senha="senha-segura-de-teste";
 const hash=scryptSync(senha,sal,64,{N:1<<14,r:8,p:1,maxmem:64*1024*1024}).toString("hex");
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,senha_salt,senha_hash) VALUES($1,'contaantiga','Conta Antiga',$2,$3)",
 [id,sal.toString("hex"),hash]);
 const verificar=criarConferenciaCredenciais(async <T>(sql:string,params:unknown[]=[])=>{
  const r=await db.query(sql,params);return r.rows as T[];
 });
 assert.equal((await verificar("contaantiga",senha))?.id,id);
 const r=await db.query<{senha_hash_v2:string;versao_sessao:number}>("SELECT senha_hash_v2,versao_sessao FROM kb_usuarios WHERE id=$1",[id]);
 assert.match(r.rows[0].senha_hash_v2,/^scrypt\$v2\$131072\$8\$1\$[a-f0-9]{128}$/);
 assert.equal(r.rows[0].versao_sessao,1);
 assert.equal((await verificar("contaantiga",senha))?.id,id);
 assert.equal(await verificar("contaantiga","errada"),null);
 const forte=await gerarHashVersionado(senha,sal);
 assert.equal(await verificarHashVersionado(senha,sal,forte),true);
 assert.equal(parametrosHashVersionado("scrypt$v2$999999999$8$1$"+"a".repeat(128)),null);
 await db.query("UPDATE kb_usuarios SET senha_hash_v2='scrypt$v2$999999999$8$1$'+$1 WHERE id=$2",["a".repeat(128),id]).catch(async()=>{
   await db.query("UPDATE kb_usuarios SET senha_hash_v2=$1 WHERE id=$2",["scrypt$v2$999999999$8$1$"+"a".repeat(128),id]);
 });
 assert.equal(await verificar("contaantiga",senha),null,"um hash v2 inválido não retorna ao hash legado");
});
