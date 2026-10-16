import { scrypt, timingSafeEqual } from "node:crypto";
import { consultar } from "./banco";

export type Papel = "administrador" | "editor" | "leitor";
export type Usuario = {
  id: string; usuario: string; nome: string; papel: Papel;
  senha_salt: string; senha_hash: string; ativo: boolean; versao_sessao: number;
};
export type UsuarioPublico = Pick<Usuario, "id" | "usuario" | "nome" | "papel">;
export const FORMATO_USUARIO = /^[a-z][a-z0-9._-]{2,39}$/;
const PARAMETROS_SCRYPT = { N: 1 << 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Preserva as opções de scrypt na assinatura assíncrona (compatível com TypeScript/Node). */
export function derivarHashSenha(credencial: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(credencial, salt, 64, PARAMETROS_SCRYPT, (erro, hash) => {
      if (erro) return reject(erro);
      resolve(hash);
    });
  });
}
const SALT_FICTICIO = Buffer.alloc(16, 0xab);
const HASH_FICTICIO = Buffer.alloc(64, 0xcd);

export async function encontrarUsuario(usuario: unknown): Promise<Usuario | null> {
  if (typeof usuario !== "string" || !FORMATO_USUARIO.test(usuario)) return null;
  const linhas = await consultar<Usuario>(
    `SELECT id, usuario, nome, papel, senha_salt, senha_hash, ativo, versao_sessao
       FROM kb_usuarios WHERE usuario = $1 LIMIT 1`, [usuario]);
  return linhas[0] ?? null;
}

/** Hash scrypt individual, com execução assíncrona para não bloquear o servidor. */
export async function conferirCredenciais(usuario: unknown, credencial: unknown): Promise<Usuario | null> {
  if (typeof credencial !== "string" || credencial.length < 12 || credencial.length > 1024) return null;
  const conta = await encontrarUsuario(usuario);
  const salt = conta && /^[0-9a-f]{32}$/.test(conta.senha_salt) ? Buffer.from(conta.senha_salt, "hex") : SALT_FICTICIO;
  const esperado = conta && /^[0-9a-f]{128}$/.test(conta.senha_hash) ? Buffer.from(conta.senha_hash, "hex") : HASH_FICTICIO;
  const gerado = await derivarHashSenha(credencial, salt);
  return conta && conta.ativo && timingSafeEqual(gerado, esperado) ? conta : null;
}
