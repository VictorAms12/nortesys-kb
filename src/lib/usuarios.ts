import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { consultar } from "./banco";

export type Papel = "administrador" | "editor" | "leitor";
export type Usuario = {
  id: string; usuario: string; nome: string; papel: Papel;
  senha_salt: string; senha_hash: string; senha_hash_v2?: string | null;
  ativo: boolean; versao_sessao: number;
};
export type UsuarioPublico = Pick<Usuario, "id" | "usuario" | "nome" | "papel">;
export const FORMATO_USUARIO = /^[a-z][a-z0-9._-]{2,39}$/;
const LEGADO = { N: 1 << 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const PARAMETROS_SCRYPT_ATUAIS = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;
const FORMATO_V2 = /^scrypt\$v2\$(\d+)\$(\d+)\$(\d+)\$([0-9a-f]{128})$/;

type Parametros = {N:number;r:number;p:number;maxmem:number};
function executarScrypt(credencial:string,salt:Buffer,opcoes:Parametros):Promise<Buffer>{
 return new Promise((resolve,reject)=>scrypt(credencial,salt,64,opcoes,(erro,hash)=>
   erro?reject(erro):resolve(hash)));
}
/** Compatibilidade explícita apenas com hashes antigos. */
export function derivarHashSenha(credencial:string,salt:Buffer):Promise<Buffer>{
 return executarScrypt(credencial,salt,LEGADO);
}
export async function gerarHashVersionado(credencial:string,salt:Buffer):Promise<string>{
 const {N,r,p}=PARAMETROS_SCRYPT_ATUAIS;
 return "scrypt$v2$"+N+"$"+r+"$"+p+"$"+
   (await executarScrypt(credencial,salt,PARAMETROS_SCRYPT_ATUAIS)).toString("hex");
}
export function parametrosHashVersionado(texto:unknown):Parametros|null{
 if(typeof texto!=="string")return null;
 const m=FORMATO_V2.exec(texto);
 if(!m)return null;
 const N=Number(m[1]),r=Number(m[2]),p=Number(m[3]);
 // Limites rígidos: não executar hashes malformados ou N arbitrários do banco.
 if(!Number.isInteger(N)||N<1<<14||N>1<<17||(N&(N-1))!==0||r!==8||p!==1)return null;
 return {N,r,p,maxmem:256*1024*1024};
}
export async function verificarHashVersionado(credencial:string,salt:Buffer,hash:string):Promise<boolean>{
 const opcoes=parametrosHashVersionado(hash);
 if(!opcoes)return false;
 const esperado=Buffer.from(hash.slice(hash.lastIndexOf("$")+1),"hex");
 return timingSafeEqual(esperado,await executarScrypt(credencial,salt,opcoes));
}
const SALT_FICTICIO=Buffer.alloc(16,0xab);
const SENHA_FICTICIA="scrypt$v2$131072$8$1$"+Buffer.alloc(64,0xcd).toString("hex");
type Query = <T>(sql:string,parametros?:unknown[])=>Promise<T[]>;
const SQL_USUARIO="SELECT id,usuario,nome,papel,senha_salt,senha_hash,senha_hash_v2,ativo,versao_sessao FROM kb_usuarios WHERE usuario=$1 LIMIT 1";
export async function encontrarUsuario(usuario:unknown):Promise<Usuario|null>{
 if(typeof usuario!=="string"||!FORMATO_USUARIO.test(usuario))return null;
 const linhas=await consultar<Usuario>(SQL_USUARIO,[usuario]);return linhas[0]??null;
}
/** Injeção do executor permite teste PGlite sem segredos ou Neon. */
export function criarConferenciaCredenciais(query:Query=consultar){
 return async(usuario:unknown,credencial:unknown):Promise<Usuario|null>=>{
  if(typeof credencial!=="string"||credencial.length===0||credencial.length>1024)return null;
  const valido=typeof usuario==="string"&&FORMATO_USUARIO.test(usuario);
  const conta=valido?(await query<Usuario>(SQL_USUARIO,[usuario]))[0]??null:null;
  const salt=conta&&/^[0-9a-f]{32}$/.test(conta.senha_salt)
    ?Buffer.from(conta.senha_salt,"hex"):SALT_FICTICIO;
  if(conta?.senha_hash_v2!=null){
    // Hash v2 inválido nunca recua para o legado.
    if(!parametrosHashVersionado(conta.senha_hash_v2))return null;
    return conta.ativo&&await verificarHashVersionado(credencial,salt,conta.senha_hash_v2)?conta:null;
  }
  if(!conta||!conta.ativo||!/^[0-9a-f]{128}$/.test(conta.senha_hash)){
    await verificarHashVersionado(credencial,SALT_FICTICIO,SENHA_FICTICIA);
    return null;
  }
  const esperado=Buffer.from(conta.senha_hash,"hex");
  const correto=timingSafeEqual(esperado,await derivarHashSenha(credencial,salt));
  if(!correto)return null;
  const novo=await gerarHashVersionado(credencial,salt);
  // UPDATE atômico, condicionado ao hash anterior, não altera versao_sessao.
  // Em concorrência, somente o primeiro login faz o rehash.
  await query("UPDATE kb_usuarios SET senha_hash_v2=$1,atualizado_em=NOW() "+
    "WHERE id=$2 AND senha_hash_v2 IS NULL AND senha_hash=$3",
    [novo,conta.id,conta.senha_hash]);
  return conta;
 };
}
export const conferirCredenciais=criarConferenciaCredenciais();
export function hashLegadoIrrecuperavel():string{
 // Novas contas armazenam um marcador aleatório legado, NÃO uma senha fraca paralela.
 return randomBytes(64).toString("hex");
}
