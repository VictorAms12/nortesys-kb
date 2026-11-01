import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {PGlite} from "@electric-sql/pglite";
import {criarLimitador,chaveTentativas,LIMITE_GLOBAL,LIMITE_IP,ipSolicitante} from "../src/lib/limite-login";

test("Terceiro não bloqueia o IP habitual; cotas IP e global; sucesso zera falhas",async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(readFileSync("db/001_auth.sql","utf8"));
 await db.exec(readFileSync("db/018_login_ips_confiaveis.sql","utf8"));
 const id=randomUUID();
 await db.query("INSERT INTO kb_usuarios(id,usuario,nome,senha_salt,senha_hash) VALUES($1,'admin01','Administrador',$2,$3)",
  [id,"a".repeat(32),"b".repeat(128)]);
 const limite=criarLimitador(async <T>(sql:string,params:unknown[]=[])=>{
  const res=await db.query(sql,params);return res.rows as T[];
 });
 const habitual="192.0.2.1",terceiro="198.51.100.2";
 await limite.sucesso("admin01",habitual,id);
 for(let i=0;i<LIMITE_GLOBAL;i++){
   // 6 IPs distintos, para respeitar o limite por IP.
   const ip="198.51.100."+String(i%6+1);
   await limite.falha("admin01",ip);
 }
 assert.equal((await limite.verificar("admin01",terceiro)).bloqueado,true);
 assert.equal((await limite.verificar("admin01",habitual)).bloqueado,false);
 await limite.sucesso("admin01",habitual,id);
 assert.equal((await limite.verificar("admin01",terceiro)).global,0);
 const ip="203.0.113.30";
 for(let i=0;i<LIMITE_IP;i++)await limite.falha("user"+i,ip);
 assert.equal((await limite.verificar("qualquer",ip)).bloqueado,true);
 assert.notEqual(chaveTentativas("ana",habitual),chaveTentativas("ana",terceiro));
 assert.equal(ipSolicitante(new Headers()),process.env.NODE_ENV==="production"?null:"desenvolvimento");
});
