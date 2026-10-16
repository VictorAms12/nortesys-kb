import "server-only";
import { randomBytes } from "node:crypto";
import { consultar } from "./banco";
import { derivarHashSenha, FORMATO_USUARIO, type Papel } from "./usuarios";

export type ContaAdmin = { id:string; usuario:string; nome:string; papel:Papel; ativo:boolean; criado_em:string };
export const PAPEIS: Papel[] = ["administrador", "editor", "leitor"];
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function listarContas(): Promise<ContaAdmin[]> {
  return consultar<ContaAdmin>(`SELECT id,usuario,nome,papel,ativo,criado_em::text AS criado_em FROM kb_usuarios ORDER BY usuario`);
}
export async function registrarEvento(ator:string, evento:string, alvo:string): Promise<void> {
  await consultar(`INSERT INTO kb_auditoria(usuario_id,evento,alvo) VALUES ($1,$2,$3)`,[ator,evento,alvo]);
}
export async function gerarCredencialHash(credencial:string): Promise<{salt:string;hash:string}> {
  if (credencial.length<12 || credencial.length>256) throw Error("credencial_invalida");
  const sal = randomBytes(16);
  return {salt:sal.toString("hex"),hash:(await derivarHashSenha(credencial,sal)).toString("hex")};
}
export function entradaContaValida(usuario: string,nome:string,papel:string): papel is Papel {
  return FORMATO_USUARIO.test(usuario) && nome.length>=2 && nome.length<=80 && PAPEIS.includes(papel as Papel);
}
