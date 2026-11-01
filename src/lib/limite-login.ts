/** Cotas distribuídas: o IP é fornecido pela borda Vercel, nunca pelo formulário. */
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { consultar } from "./banco";

export const MAXIMO_TENTATIVAS = 5;
export const LIMITE_IP = 20;
export const LIMITE_GLOBAL = 30;
type Query = <T>(sql: string, parametros?: unknown[]) => Promise<T[]>;
type Contadores = { porIpUsuario: number; porIp: number; global: number };
const digesto = (valor: string) => createHash("sha256").update(valor).digest("hex");
const usuarioValido = (usuario: unknown): string =>
  typeof usuario === "string" && /^[a-z][a-z0-9._-]{2,39}$/.test(usuario) ? usuario : "invalido";
/** A coluna chave tem VARCHAR(60). Nenhum IP ou nome é persistido em texto puro. */
export function chaveTentativas(usuario: unknown, ip = "local"): string {
  return "ui:" + digesto(usuarioValido(usuario) + "\u0000" + ip).slice(0, 48);
}
export function ipSolicitante(headers: Pick<Headers,"get">): string | null {
  // A Vercel sobrescreve esse cabeçalho. Não aceitar x-forwarded-for genérico
  // enviado por cliente; instalações fora da Vercel precisam adaptar o proxy confiável.
  if (process.env.NODE_ENV !== "production") return "desenvolvimento";
  const ip = headers.get("x-vercel-forwarded-for")?.trim() ?? "";
  return isIP(ip) !== 0 ? ip : null;
}
const chaves = (usuario: unknown, ip: string) => ({
  par: chaveTentativas(usuario, ip),
  ip: "ip:" + digesto(ip).slice(0,48),
  usuario: "u:" + digesto(usuarioValido(usuario)).slice(0,48),
  ipHash: digesto(ip),
});
const SQL_INCREMENTAR = [
 "INSERT INTO kb_login_tentativas(chave,quantidade,expira_em)",
 "VALUES($1,1,NOW()+make_interval(mins => $2::int))",
 "ON CONFLICT(chave) DO UPDATE SET",
 "quantidade=CASE WHEN kb_login_tentativas.expira_em<=NOW() THEN 1 ELSE kb_login_tentativas.quantidade+1 END,",
 "expira_em=CASE WHEN kb_login_tentativas.expira_em<=NOW() THEN NOW()+make_interval(mins => $2::int) ELSE kb_login_tentativas.expira_em END",
 "RETURNING quantidade"
].join(" ");
/** Permite testes de integração PGlite sem conexão ao Neon. */
export function criarLimitador(query: Query = consultar) {
  async function verificar(usuario: unknown, ip: string): Promise<Contadores & { bloqueado:boolean }> {
    const k=chaves(usuario,ip);
    const linhas=await query<{chave:string;quantidade:number}>(
      "SELECT chave,quantidade FROM kb_login_tentativas WHERE chave=ANY($1::text[]) AND expira_em>NOW()",
      [[k.par,k.ip,k.usuario]]);
    const mapa=new Map(linhas.map(r=>[r.chave,r.quantidade]));
    const porIpUsuario=mapa.get(k.par)??0,porIp=mapa.get(k.ip)??0,global=mapa.get(k.usuario)??0;
    const confiaveis=global>=LIMITE_GLOBAL
      ?await query<{valido:boolean}>("SELECT EXISTS(SELECT 1 FROM kb_login_ips_confiaveis c JOIN kb_usuarios u ON u.id=c.usuario_id WHERE u.usuario=$1 AND c.ip_hash=$2) AS valido",[usuarioValido(usuario),k.ipHash])
      :[];
    return {porIpUsuario,porIp,global,bloqueado:porIpUsuario>=MAXIMO_TENTATIVAS||porIp>=LIMITE_IP||
      (global>=LIMITE_GLOBAL&&!confiaveis[0]?.valido)};
  }
  async function falha(usuario: unknown,ip:string):Promise<Contadores> {
    const k=chaves(usuario,ip);
    const incrementar=async(chave:string,minutos:number)=>
      (await query<{quantidade:number}>(SQL_INCREMENTAR,[chave,minutos]))[0]?.quantidade??0;
    // Todos os limites verificam estado global no PostgreSQL (não em memória local).
    return {porIpUsuario:await incrementar(k.par,15),porIp:await incrementar(k.ip,15),
      global:await incrementar(k.usuario,60)};
  }
  async function sucesso(usuario:string,ip:string,id:string):Promise<void>{
    const k=chaves(usuario,ip);
    // Mantém somente um marcador de IP bem-sucedido, sem armazenar endereços completos.
    await query("INSERT INTO kb_login_ips_confiaveis(usuario_id,ip_hash,ultimo_sucesso) VALUES($1,$2,NOW()) "+
      "ON CONFLICT(usuario_id,ip_hash) DO UPDATE SET ultimo_sucesso=NOW()",[id,k.ipHash]);
    await query("DELETE FROM kb_login_tentativas WHERE chave=ANY($1::text[])",[[k.par,k.ip,k.usuario]]);
  }
  return {verificar,falha,sucesso};
}
const limitador=criarLimitador();
export const verificarTentativas=limitador.verificar;
export const registrarFalha=limitador.falha;
export const registrarLoginBemSucedido=limitador.sucesso;
export function atrasoProgressivo(quantidade:number):number{
  return Math.min(600,80*2**Math.min(3,Math.max(0,quantidade-1)));
}
