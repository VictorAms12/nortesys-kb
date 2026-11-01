import "server-only";
import {cache} from "react";
import {consultar} from "./banco";
import {SQL_RESOLVER_ALIAS_ARTIGO} from "./artigos-alias-sql";
import type {Papel} from "./usuarios";
const URL_ARTIGO=/^\/artigos\/[a-z0-9-]+\/[a-z0-9-]+$/;

/** Compatível com produção enquanto a migração 017 ainda não foi aplicada.
 *  Redirecionamentos apenas para artigos que também aparecem no catálogo visível. */
export const resolverAliasArtigo=cache(async (url:string,papel:Papel):Promise<string|null>=>{
 if(url.length>300||!URL_ARTIGO.test(url))return null;
 try{
  const rows=await consultar<{categoria:string;slug:string}>(SQL_RESOLVER_ALIAS_ARTIGO,[url,papel]);
  const destino=rows[0];
  return destino?`/artigos/${destino.categoria}/${destino.slug}`:null;
 }catch(e){
  if(e&&typeof e==="object"&&"code" in e&&e.code==="42P01")return null;
  throw e;
 }
});
