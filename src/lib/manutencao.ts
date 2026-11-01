import "server-only";
import {del} from "@vercel/blob";
import {consultar} from "./banco";
import {migracao009Aplicada} from "./migracao-009";
import {LOTE_MANUTENCAO,RODADAS_RETENCAO,SQL_LIMPAR_TEMPORARIOS,SQL_LIMPAR_NOTIFICACOES,
 SQL_LIMPAR_COTAS_AVATAR,SQL_LIMPAR_COTAS_BUSCA,SQL_LIMPAR_AUDITORIA} from "./manutencao-sql";

type Fila={caminho:string};
function diasRetencao():number {
 const valor=Number(process.env.NOTIFICACOES_RETENCAO_DIAS??30);
 return Number.isSafeInteger(valor)&&valor>=7&&valor<=365?valor:30;
}
export function diasRetencaoAuditoria():number {
 const valor=Number(process.env.AUDITORIA_RETENCAO_DIAS??365);
 return Number.isSafeInteger(valor)&&valor>=30&&valor<=1825?valor:365;
}
/** Rotina manual, lote pequeno e reserva por 2 minutos para evitar exclusões concorrentes. */
export async function executarManutencao():Promise<{limpas:number;falhas:number;temporarios:number;notificacoes:number;limites:number;auditoria:number}>{
 if(!(await migracao009Aplicada()))throw Error("Migração 009 pendente.");
 /** Limite máximo por execução: 5 × 200 por tipo, sem varreduras DELETE ilimitadas. */
 async function limparEmLotes(query:string,parametros:unknown[]):Promise<number>{
  let total=0;
  for(let rodada=0;rodada<RODADAS_RETENCAO;rodada++){
   const linhas=await consultar<{total:number}>(query,parametros);
   const quantidade=linhas[0]?.total??0;
   total+=quantidade;
   if(quantidade<LOTE_MANUTENCAO)break;
  }
  return total;
 }
 // A consulta soma duas filas (sessões e tentativas), que podem remover 200 itens cada.
 let temporarios=0;
 for(let rodada=0;rodada<RODADAS_RETENCAO;rodada++){
  const linhas=await consultar<{total:number}>(SQL_LIMPAR_TEMPORARIOS,[LOTE_MANUTENCAO]);
  const quantidade=linhas[0]?.total??0;
  temporarios+=quantidade;
  if(quantidade<LOTE_MANUTENCAO)break;
 }
 // Compatibilidade: um ambiente que ainda não recebeu 010/013 continua
 // apto a limpar sessões e imagens, sem tentar consultar tabelas ausentes.
 const [recursos]=await consultar<{notificacoes:boolean;avatar:boolean;busca:boolean}>(`
  SELECT to_regclass('public.kb_notificacoes') IS NOT NULL AS notificacoes,
         to_regclass('public.kb_avatar_limites') IS NOT NULL AS avatar,
         to_regclass('public.kb_busca_sugestoes_limites') IS NOT NULL AS busca`);
 const auditoria=await limparEmLotes(SQL_LIMPAR_AUDITORIA,[diasRetencaoAuditoria(),LOTE_MANUTENCAO]);
 const notificacoes=recursos?.notificacoes
  ?await limparEmLotes(SQL_LIMPAR_NOTIFICACOES,[diasRetencao(),LOTE_MANUTENCAO]):0;
 const [limitesAvatar,limitesBusca]=await Promise.all([
  recursos?.avatar?limparEmLotes(SQL_LIMPAR_COTAS_AVATAR,[LOTE_MANUTENCAO]):Promise.resolve(0),
  recursos?.busca?limparEmLotes(SQL_LIMPAR_COTAS_BUSCA,[LOTE_MANUTENCAO]):Promise.resolve(0)
 ]);
 const limites=limitesAvatar+limitesBusca;
 const fila=await consultar<Fila>(`WITH candidatos AS (
  SELECT caminho FROM kb_chat_imagens_limpeza
   WHERE reservada_ate IS NULL OR reservada_ate<NOW()
   ORDER BY criada_em LIMIT 10 FOR UPDATE SKIP LOCKED
 ) UPDATE kb_chat_imagens_limpeza q SET reservada_ate=NOW()+INTERVAL '2 minutes',
    tentativas=q.tentativas+1 FROM candidatos c WHERE q.caminho=c.caminho
    RETURNING q.caminho`);
 let limpas=0,falhas=0;
 for(const {caminho} of fila){
  try{
   if(!/^kb-chat-imagens\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(caminho))
    throw Error("Caminho inválido");
   // Dupla checagem: uma imagem ainda acessível em qualquer mensagem não é excluída.
   const acessivel=await consultar<{id:number}>(
    "SELECT id FROM kb_chat_mensagens WHERE imagem_caminho=$1 AND apagada_para_todos_em IS NULL LIMIT 1",[caminho]);
   if(acessivel.length)throw Error("Imagem ainda vinculada");
   await del(caminho,{abortSignal:AbortSignal.timeout(15_000)});
   await consultar("DELETE FROM kb_chat_imagens_limpeza WHERE caminho=$1",[caminho]);limpas++;
  }catch(e){
   falhas++;
   console.error("[manutencao] Falha ao limpar objeto privado",e instanceof Error?e.name:"erro");
   // A reserva vence e o registro continua disponível para nova tentativa.
  }
 }
 return {limpas,falhas,temporarios,notificacoes,limites,auditoria};
}
export async function situacaoManutencao(){
 const habilitada=await migracao009Aplicada();
 const [fila,sessoes]=await Promise.all([
  habilitada?consultar<{total:number;pendentes:number}>(
   "SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE reservada_ate IS NULL OR reservada_ate<NOW())::int AS pendentes FROM kb_chat_imagens_limpeza"):
   Promise.resolve([{total:0,pendentes:0}]),
  consultar<{total:number}>("SELECT COUNT(*)::int AS total FROM kb_sessoes WHERE expira_em<NOW()")
 ]);
 return {habilitada,fila:fila[0]?.total??0,pendentes:fila[0]?.pendentes??0,sessoesExpiradas:sessoes[0]?.total??0};
}
