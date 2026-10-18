import "server-only";
import { consultar } from "./banco";
import type { Artigo } from "../types/artigo";
import type { Papel } from "./usuarios";
import { carregarTodosArtigos } from "./artigos-banco";

const URL_ARTIGO = /^\/artigos\/[a-z0-9-]+\/[a-z0-9-]+$/;
export function urlArtigoValida(valor: unknown): valor is string {
  return typeof valor === "string" && valor.length <= 300 && URL_ARTIGO.test(valor);
}
export async function favoritosUsuario(id: string): Promise<string[]> {
  const linhas=await consultar<{artigo_url:string}>("SELECT artigo_url FROM kb_favoritos WHERE usuario_id=$1 ORDER BY criado_em DESC LIMIT 300",[id]);
  return linhas.map(x=>x.artigo_url);
}
export async function leiturasUsuario(id: string): Promise<string[]> {
  const linhas=await consultar<{artigo_url:string}>("SELECT artigo_url FROM kb_leituras WHERE usuario_id=$1 ORDER BY acessado_em DESC LIMIT 30",[id]);
  return linhas.map(x=>x.artigo_url);
}
export async function favoritoAtivo(id:string, url:string): Promise<boolean> {
  if(!urlArtigoValida(url)) return false;
  const linhas=await consultar<{existe:boolean}>("SELECT EXISTS(SELECT 1 FROM kb_favoritos WHERE usuario_id=$1 AND artigo_url=$2) AS existe",[id,url]);
  return Boolean(linhas[0]?.existe);
}
export async function alterarFavorito(id:string,url:string,ativo:boolean): Promise<void> {
  if(!urlArtigoValida(url)) throw Error("URL inválida");
  if(ativo) await consultar("INSERT INTO kb_favoritos(usuario_id,artigo_url) VALUES($1,$2) ON CONFLICT DO NOTHING",[id,url]);
  else await consultar("DELETE FROM kb_favoritos WHERE usuario_id=$1 AND artigo_url=$2",[id,url]);
}
export async function registrarLeitura(id:string,url:string):Promise<void>{
  if(!urlArtigoValida(url))throw Error("URL inválida");
  await consultar(`INSERT INTO kb_leituras(usuario_id,artigo_url) VALUES ($1,$2)
    ON CONFLICT (usuario_id,artigo_url) DO UPDATE SET acessado_em=NOW()`,[id,url]);
}
export async function artigosDoUsuario(id:string,papel:Papel,modo:"favoritos"|"recentes"):Promise<Artigo[]>{
  const [urls, artigos] = await Promise.all([
    modo === "favoritos" ? favoritosUsuario(id) : leiturasUsuario(id),
    carregarTodosArtigos(papel),
  ]);
  const mapa=new Map(artigos.map(a=>[a.url,a]));
  return urls.map(url=>mapa.get(url)).filter((x):x is Artigo=>Boolean(x));
}
