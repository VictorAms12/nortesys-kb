import "server-only";
import {consultar} from "./banco";
export const ROTULOS_AUDITORIA:Record<string,string>={
 login_sucesso:"Login realizado",login_falha:"Tentativa de login inválida",logout_sucesso:"Logout realizado",
 artigo_inicio_criacao:"Iniciou criação de artigo",artigo_inicio_edicao:"Abriu editor de artigo",
 artigo_criado:"Criou artigo",artigo_editado:"Editou artigo",artigo_arquivado:"Arquivou artigo",
 artigo_visualizado:"Consultou artigo",artigo_favoritado:"Favoritou artigo",artigo_desfavoritado:"Removeu favorito",
 usuario_criado:"Criou usuário",usuario_editar:"Editou usuário",usuario_ativar:"Ativou usuário",
 usuario_desativar:"Desativou usuário",usuario_senha_redefinida:"Redefiniu senha",
 anexo_enviado:"Enviou PDF",anexo_removido:"Removeu PDF",imagem_enviada:"Enviou imagem",chat_aberto:"Abriu chat",
 chat_conversa_criada:"Iniciou conversa privada",chat_mensagem_enviada:"Enviou mensagem",
 chat_mensagem_lida:"Leu conversa",diagnostico_aberto:"Abriu diagnóstico guiado",
 registro_aberto:"Abriu gerador técnico"
};
export async function registrarAuditoriaSegura(usuarioId:string|null,evento:string,alvo:string,
 {limitarMinutos=0}:{limitarMinutos?:number}={}):Promise<void>{
 try {
   if(limitarMinutos>0) await consultar(
     "INSERT INTO kb_auditoria(usuario_id,evento,alvo) SELECT $1,$2,$3 WHERE NOT EXISTS "+
     "(SELECT 1 FROM kb_auditoria WHERE usuario_id IS NOT DISTINCT FROM $1::uuid "+
     "AND evento=$2 AND alvo=$3 AND data>NOW()-($4::int * INTERVAL '1 minute'))",
     [usuarioId,evento,alvo.slice(0,100),limitarMinutos]);
   else await consultar("INSERT INTO kb_auditoria(usuario_id,evento,alvo) VALUES($1,$2,$3)",
     [usuarioId,evento,alvo.slice(0,100)]);
 }catch(error){console.error("[auditoria] Falha:",evento,error instanceof Error?error.name:"erro");}
}
