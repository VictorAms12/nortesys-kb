import "server-only";
import {del} from "@vercel/blob";
import {consultar} from "./banco";
import {migracao009Aplicada} from "./migracao-009";

type Fila={caminho:string};
/** Rotina manual, lote pequeno e reserva por 2 minutos para evitar exclusões concorrentes. */
export async function executarManutencao():Promise<{limpas:number;falhas:number;temporarios:number}>{
 if(!(await migracao009Aplicada()))throw Error("Migração 009 pendente.");
 const temporarios=await consultar<{total:number}>(`WITH sessao AS (
 DELETE FROM kb_sessoes WHERE expira_em<NOW() RETURNING token_hash
 ), tentativas AS (
 DELETE FROM kb_login_tentativas WHERE expira_em<NOW() RETURNING chave
 ) SELECT ((SELECT COUNT(*) FROM sessao)+(SELECT COUNT(*) FROM tentativas))::int AS total`);
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
 return {limpas,falhas,temporarios:temporarios[0]?.total??0};
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
