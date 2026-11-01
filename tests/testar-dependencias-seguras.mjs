import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/** Evita regressões em dependências transitivas, independentemente do npm audit online. */
test("Zod (inclusive transitivo do Vercel Blob) usa versão corrigida",()=>{
 const pacote=JSON.parse(readFileSync("package.json","utf8"));
 const lock=JSON.parse(readFileSync("package-lock.json","utf8"));
 assert.equal(pacote.dependencies.zod,"^4.6.6");
 assert.equal(lock.packages[""].dependencies.zod,pacote.dependencies.zod);
 assert.deepEqual(pacote.overrides?.["@vercel/cli-config"],{zod:"^4.6.6"});
 assert.equal(lock.packages["node_modules/@vercel/blob"].version,"2.8.2");
 assert.equal(lock.packages["node_modules/@vercel/cli-config"].version,"0.3.1");
 const zods=Object.entries(lock.packages).filter(([p])=>p==="node_modules/zod"||p.endsWith("/node_modules/zod"));
 assert.ok(zods.length>0);
 for(const [caminho,metadata] of zods){
   const [major,minor,patch]=(metadata.version??"0.0.0").split(".").map(Number);
   assert.ok(major>4||(major===4&&(minor>6||(minor===6&&patch>=6))),caminho+" ainda vulnerável: "+metadata.version);
 }
 assert.equal(lock.packages["node_modules/@vercel/cli-config/node_modules/zod"],undefined,
   "não manter cópia transitiva vulnerável do Zod");
});
