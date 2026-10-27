import "server-only";
import {consultar} from "./banco";
import {urlArtigoValida} from "./interacoes";

export async function feedbackUsuario(usuario:string,url:string):Promise<boolean|null>{
 if(!urlArtigoValida(url))return null;
 const linhas=await consultar<{resolveu:boolean}>(
  "SELECT resolveu FROM kb_artigo_feedback WHERE usuario_id=$1 AND artigo_url=$2 LIMIT 1",[usuario,url]);
 return linhas.length?linhas[0].resolveu:null;
}
export async function salvarFeedback(usuario:string,url:string,resolveu:boolean):Promise<void>{
 if(!urlArtigoValida(url)||typeof resolveu!=="boolean")throw Error("Feedback inválido.");
 await consultar("INSERT INTO kb_artigo_feedback(usuario_id,artigo_url,resolveu) VALUES($1,$2,$3) "+
  "ON CONFLICT(usuario_id,artigo_url) DO UPDATE SET resolveu=EXCLUDED.resolveu,atualizado_em=NOW()",
 [usuario,url,resolveu]);
}
