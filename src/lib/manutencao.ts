import "server-only";
import {del} from "@vercel/blob";
import {consultar} from "./banco";
import {migracao009Aplicada} from "./migracao-009";

type Fila={caminho:string};
function diasRetencao():number {
 const valor=Number(process.env.NOTIFICACOES_RETENCAO_DIAS??30);
 return Number.isSafeInteger(valor)&&valor>=7&&valor<=365?valor:30;
}
/** Rotina manual, lote pequeno e reserva por 2 minutos para evitar exclusões concorrentes. */
export async function executarManutencao():Promise<{limpas:number;falhas:number;temporarios:number;notificacoes:number;limites:number}>{
 if(!(await migracao009Aplicada()))throw Error("Migração 009 pendente.");
 const temporarios=await consultar<{total:number}>(`WITH sessao AS (
 DELETE FROM kb_sessoes WHERE expira_em<NOW() RETURNING token_hash
 ), tentativas AS (
 DELETE FROM kb_login_tentativas WHERE expira_em<NOW() RETURNING chave
 ) SELECT ((SELECT COUNT(*) FROM sessao)+(SELECT COUNT(*) FROM tentativas))::int AS total`);
 const retencao=await consultar<{notificacoes:number;limites:number}>(`
  WITH notificacoes AS (
    DELETE FROM kb_notificacoes
    WHERE criada_em < NOW() - make_interval(days => $1::int)
    RETURNING id
  ), limites_avatar AS (
    DELETE FROM kb_avatar_limites
    WHERE janela_em < NOW() - INTERVAL '1 day'
    RETURNING usuario_id
  ), limites_busca AS (
    DELETE FROM kb_busca_sugestoes_limites
    WHERE janela_em < NOW() - INTERVAL '1 day'
    RETURNING usuario_id
  )
  SELECT (SELECT COUNT(*)::int FROM notificacoes) AS notificacoes,
         ((SELECT COUNT(*) FROM limites_avatar)+(SELECT COUNT(*) FROM limites_busca))::int AS limites
 `,[diasRetencao()]);
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
 return {limpas,falhas,temporarios:temporarios[0]?.total??0,notificacoes:retencao[0]?.notificacoes??0,limites:retencao[0]?.limites??0};
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
