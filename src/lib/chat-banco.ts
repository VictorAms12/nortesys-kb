import "server-only";
import {consultar} from "./banco";
import {CHAT_GERAL_ID,CHAT_UUID,type EstadoChat,type MensagemChat,type ConversaChat,type UsuarioChat} from "./chat-tipos";
import {registrarAuditoriaSegura} from "./auditoria-eventos";
import {publicarChat} from "./chat-ably";
export class ErroChat extends Error {constructor(public status:number,mensagem:string){super(mensagem);}}
type UsuarioLinha={id:string;nome:string;usuario:string;presenca:"online"|"ausente"|"offline"};
type ConversaLinha={id:string;tipo:"geral"|"privada";nome:string;nao_lidas:number;
 ultima_mensagem:string|null;ultimo_horario:string|null;outro_id:string|null};
type MsgLinha={id:number;conversa_id:string;autor_id:string;autor:string;texto:string;criado_em:string};
export async function conversaPermitida(usuario:string,conversa:string):Promise<boolean>{
 if(!CHAT_UUID.test(conversa))return false;
 const rows=await consultar<{ok:number}>("SELECT 1 AS ok FROM kb_chat_participantes WHERE usuario_id=$1 AND conversa_id=$2 LIMIT 1",[usuario,conversa]);
 return rows.length>0;
}
export async function garantirGeral(usuario:string):Promise<void>{
 await consultar("INSERT INTO kb_chat_participantes(conversa_id,usuario_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
 [CHAT_GERAL_ID,usuario]);
}
export async function estadoChat(usuario:string,ablyConfigurado:boolean):Promise<EstadoChat>{
 await garantirGeral(usuario);
 const [pessoas,conversas]=await Promise.all([
  consultar<UsuarioLinha>(
    "SELECT u.id,u.nome,u.usuario,CASE WHEN p.visto_em>NOW()-INTERVAL '120 seconds' "+
    "THEN CASE WHEN p.ativo_em>NOW()-INTERVAL '5 minutes' THEN 'online' ELSE 'ausente' END "+
    "ELSE 'offline' END AS presenca FROM kb_usuarios u "+
    "LEFT JOIN kb_chat_presenca p ON p.usuario_id=u.id WHERE u.ativo=true ORDER BY u.nome"
  ),
  consultar<ConversaLinha>(
    "SELECT c.id,c.tipo,CASE WHEN c.tipo='geral' THEN 'Equipe — Geral' "+
    "ELSE COALESCE(outro.nome,'Colaborador indisponível') END AS nome, "+
    "(SELECT COUNT(*)::int FROM kb_chat_mensagens m WHERE m.conversa_id=c.id "+
    "AND m.id>p.ultima_lida_id AND m.autor_id<>$1) AS nao_lidas, "+
    "ultima.texto AS ultima_mensagem,ultima.criado_em::text AS ultimo_horario,outro.id AS outro_id "+
    "FROM kb_chat_conversas c JOIN kb_chat_participantes p ON p.conversa_id=c.id AND p.usuario_id=$1 "+
    "LEFT JOIN LATERAL (SELECT m.texto,m.criado_em FROM kb_chat_mensagens m "+
    "WHERE m.conversa_id=c.id ORDER BY m.id DESC LIMIT 1) ultima ON TRUE "+
    "LEFT JOIN LATERAL (SELECT u.id,u.nome FROM kb_chat_participantes p2 "+
    "JOIN kb_usuarios u ON u.id=p2.usuario_id WHERE p2.conversa_id=c.id "+
    "AND p2.usuario_id<>$1 LIMIT 1) outro ON TRUE "+
    "ORDER BY CASE WHEN c.tipo='geral' THEN 0 ELSE 1 END,ultima.criado_em DESC NULLS LAST,c.criado_em DESC",[usuario])
 ]);
 const users:UsuarioChat[]=pessoas;
 const lista:ConversaChat[]=conversas.map(c=>({id:c.id,tipo:c.tipo,nome:c.nome,naoLidas:c.nao_lidas,
   ultimaMensagem:c.ultima_mensagem,ultimoHorario:c.ultimo_horario,outroId:c.outro_id}));
 return {eu:usuario,usuarios:users,conversas:lista,ablyConfigurado};
}
export async function listarMensagens(usuario:string,conversa:string,antes:number|null,pesquisa:string):Promise<MensagemChat[]>{
 if(!await conversaPermitida(usuario,conversa))throw new ErroChat(404,"Conversa não encontrada.");
 const rows=await consultar<MsgLinha>(
   "SELECT m.id,m.conversa_id,m.autor_id,u.nome AS autor,m.texto,m.criado_em::text AS criado_em "+
   "FROM kb_chat_mensagens m JOIN kb_usuarios u ON u.id=m.autor_id "+
   "WHERE m.conversa_id=$1 AND ($2::bigint IS NULL OR m.id<$2::bigint) "+
   "AND ($3::text='' OR m.texto ILIKE ('%'||$3||'%')) ORDER BY m.id DESC LIMIT 60",
   [conversa,antes,pesquisa]);
 return rows.reverse().map(m=>({id:m.id,conversaId:m.conversa_id,autorId:m.autor_id,
   autor:m.autor,texto:m.texto,criadoEm:m.criado_em}));
}
export async function abrirConversaPrivada(usuario:string,alvo:string):Promise<string>{
 if(!CHAT_UUID.test(alvo)||alvo===usuario)throw new ErroChat(400,"Escolha outro colaborador.");
 const [a,b]=[usuario,alvo].sort();
 const chave="dm:"+a+":"+b;
 const rows=await consultar<{id:string}>(
   "WITH pessoa AS (SELECT id FROM kb_usuarios WHERE id=$2 AND ativo=true AND id<>$1), "+
   "nova AS (INSERT INTO kb_chat_conversas(tipo,chave,criado_por) "+
   "SELECT 'privada',$3,$1 FROM pessoa ON CONFLICT(chave) DO UPDATE SET chave=EXCLUDED.chave RETURNING id), "+
   "partes AS (INSERT INTO kb_chat_participantes(conversa_id,usuario_id) "+
   "SELECT nova.id,ids.id FROM nova CROSS JOIN (SELECT $1::uuid AS id UNION SELECT $2::uuid AS id) ids "+
   "ON CONFLICT DO NOTHING RETURNING conversa_id) SELECT id FROM nova",[usuario,alvo,chave]);
 if(!rows.length)throw new ErroChat(404,"Colaborador não encontrado.");
 await registrarAuditoriaSegura(usuario,"chat_conversa_criada",rows[0].id,{limitarMinutos:15});
 return rows[0].id;
}
async function consumirLimite(usuario:string):Promise<boolean>{
 const rows=await consultar<{quantidade:number}>(
  "INSERT INTO kb_chat_limites(usuario_id,inicio_em,quantidade) VALUES($1,NOW(),1) "+
  "ON CONFLICT(usuario_id) DO UPDATE SET "+
  "quantidade=CASE WHEN kb_chat_limites.inicio_em<=NOW()-INTERVAL '30 seconds' "+
  "THEN 1 ELSE kb_chat_limites.quantidade+1 END, "+
  "inicio_em=CASE WHEN kb_chat_limites.inicio_em<=NOW()-INTERVAL '30 seconds' "+
  "THEN NOW() ELSE kb_chat_limites.inicio_em END "+
  "WHERE kb_chat_limites.inicio_em<=NOW()-INTERVAL '30 seconds' OR kb_chat_limites.quantidade<15 "+
  "RETURNING quantidade",[usuario]);
 return rows.length>0;
}
async function destinatarios(usuario:string,conversa:string){
 const c=await consultar<{tipo:"geral"|"privada";outro_id:string|null}>(
  "SELECT c.tipo,(SELECT p2.usuario_id FROM kb_chat_participantes p2 "+
  "WHERE p2.conversa_id=c.id AND p2.usuario_id<>$1 LIMIT 1) AS outro_id "+
  "FROM kb_chat_conversas c JOIN kb_chat_participantes p ON p.conversa_id=c.id "+
  "WHERE c.id=$2 AND p.usuario_id=$1 LIMIT 1",[usuario,conversa]);
 if(!c.length)throw new ErroChat(404,"Conversa indisponível.");
 return c[0];
}
export async function enviarMensagem(usuario:string,conversa:string,texto:string):Promise<MensagemChat>{
 if(!CHAT_UUID.test(conversa))throw new ErroChat(400,"Conversa inválida.");
 const limpo=texto.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,"").trim();
 if(!limpo||limpo.length>2000)throw new ErroChat(400,"Mensagem deve ter de 1 a 2000 caracteres.");
 const destino=await destinatarios(usuario,conversa);
 if(!await consumirLimite(usuario))throw new ErroChat(429,"Muitas mensagens. Aguarde alguns segundos.");
 const mensagens=await consultar<MsgLinha>(
  "INSERT INTO kb_chat_mensagens(conversa_id,autor_id,texto) "+
  "SELECT $1,$2,$3 WHERE EXISTS (SELECT 1 FROM kb_chat_participantes "+
  "WHERE conversa_id=$1 AND usuario_id=$2) "+
  "RETURNING id,conversa_id,autor_id,(SELECT nome FROM kb_usuarios WHERE id=$2) AS autor,texto,criado_em::text AS criado_em",
  [conversa,usuario,limpo]);
 if(!mensagens.length)throw new ErroChat(403,"Acesso negado à conversa.");
 const m=mensagens[0];
 await registrarAuditoriaSegura(usuario,"chat_mensagem_enviada",conversa);
 const evento={conversaId:conversa,id:m.id};
 if(destino.tipo==="geral")await publicarChat("kb-chat:geral","mensagem",evento);
 else {
   const ids=[usuario,destino.outro_id].filter((id):id is string=>Boolean(id));
   await Promise.all(ids.map(id=>publicarChat("kb-chat:usuario:"+id,"mensagem",evento)));
 }
 return {id:m.id,conversaId:m.conversa_id,autorId:m.autor_id,autor:m.autor,texto:m.texto,criadoEm:m.criado_em};
}
export async function marcarLida(usuario:string,conversa:string):Promise<void>{
 if(!CHAT_UUID.test(conversa))throw new ErroChat(400,"Conversa inválida.");
 const rows=await consultar<{usuario_id:string}>(
  "UPDATE kb_chat_participantes p SET ultima_lida_id=GREATEST(p.ultima_lida_id, "+
  "COALESCE((SELECT MAX(m.id) FROM kb_chat_mensagens m WHERE m.conversa_id=$1),0)) "+
  "WHERE p.usuario_id=$2 AND p.conversa_id=$1 RETURNING p.usuario_id",[conversa,usuario]);
 if(!rows.length)throw new ErroChat(404,"Conversa não encontrada.");
 // Leitura não é auditada por mensagem para evitar milhares de eventos repetitivos.
}
export async function atualizarPresenca(usuario:string,ativo:boolean):Promise<void>{
 await consultar("INSERT INTO kb_chat_presenca(usuario_id,visto_em,ativo_em) VALUES($1,NOW(),NOW()) "+
   "ON CONFLICT(usuario_id) DO UPDATE SET visto_em=NOW(), "+
   "ativo_em=CASE WHEN $2::boolean THEN NOW() ELSE kb_chat_presenca.ativo_em END",[usuario,ativo]);
}
export async function avisarDigitando(usuario:string,conversa:string):Promise<void>{
 const destino=await destinatarios(usuario,conversa);
 const rows=await consultar<{usuario_id:string}>(
 "INSERT INTO kb_chat_digitacao_limites(usuario_id,ultimo_em) VALUES($1,NOW()) "+
 "ON CONFLICT(usuario_id) DO UPDATE SET ultimo_em=NOW() "+
 "WHERE kb_chat_digitacao_limites.ultimo_em<NOW()-INTERVAL '3 seconds' RETURNING usuario_id",[usuario]);
 if(!rows.length)return;
 const evento={conversaId:conversa,autorId:usuario};
 if(destino.tipo==="geral")await publicarChat("kb-chat:geral","digitando",evento);
 else if(destino.outro_id)await publicarChat("kb-chat:usuario:"+destino.outro_id,"digitando",evento);
}
