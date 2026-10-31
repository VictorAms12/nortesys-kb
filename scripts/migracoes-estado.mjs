/** Inventário somente leitura para reconciliar bancos com migrações SQL antigas aplicadas manualmente. */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const marcas = {
 "001": {tabelas:["kb_usuarios","kb_sessoes","kb_login_tentativas"],indices:["kb_sessoes_usuario_id_idx","kb_sessoes_expira_em_idx","kb_login_tentativas_expira_idx"]},
 "002": {tabelas:["kb_artigos","kb_artigo_versoes","kb_auditoria"],indices:["kb_artigos_visiveis_idx","kb_auditoria_data_idx"]},
 "003": {tabelas:["kb_favoritos","kb_leituras"],indices:["kb_favoritos_usuario_data_idx","kb_leituras_usuario_data_idx"]},
 "004": {tabelas:["kb_imagens","kb_imagem_limites"],gatilhos:["kb_artigos_associar_imagens"],funcoes:["kb_associar_imagens_artigo"]},
 "005": {tabelas:["kb_anexos","kb_anexo_limites"],indices:["kb_anexos_artigo_idx"]},
 "006": {tabelas:["kb_chat_conversas","kb_chat_participantes","kb_chat_mensagens","kb_chat_presenca","kb_chat_limites","kb_chat_digitacao_limites"],indices:["kb_chat_mensagens_conversa_idx"]},
 "007": {tabelas:["kb_chat_mensagens_ocultas"],colunas:["kb_chat_mensagens.respondendo_a_id","kb_chat_mensagens.apagada_para_todos_em","kb_chat_participantes.limpa_ate_id"]},
 "008": {colunas:["kb_chat_mensagens.imagem_caminho","kb_chat_mensagens.imagem_mime","kb_chat_mensagens.imagem_tamanho"],restricoes:["kb_chat_imagem_valida"],indices:["kb_chat_imagem_caminho_unique"]},
 "009": {tabelas:["kb_artigo_feedback","kb_buscas_sem_resultado","kb_busca_estatistica_limites","kb_chat_imagens_limpeza"],gatilhos:["kb_chat_imagem_exclusao_global"]},
 "010": {tabelas:["kb_notificacoes","kb_push_subscricoes"],colunas:["kb_usuarios.bio","kb_usuarios.avatar_caminho","kb_usuarios.preferencias_notificacoes"],gatilhos:["kb_chat_notificacoes_fase8"]},
 "011": {colunas:["kb_chat_participantes.silenciada"],indices:["kb_chat_participantes_alertas_idx"]},
 "012": {restricoes:["kb_chat_texto_valido"],ausentes:{restricoes:["kb_chat_mensagens_texto_check"]}},
 "013": {tabelas:["kb_avatar_limites","kb_busca_sugestoes_limites"],indices:["kb_notificacoes_retencao_idx","kb_notificacoes_nao_lidas_idx"]},
 "014": {gatilhos:["kb_usuarios_proteger_ultimo_admin"],funcoes:["kb_proteger_ultimo_admin"]},
};

export const SQL_INVENTARIO = `SELECT
 ARRAY(SELECT table_name::text FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tabelas,
 ARRAY(SELECT (table_name||'.'||column_name)::text FROM information_schema.columns WHERE table_schema='public') AS colunas,
 ARRAY(SELECT indexname::text FROM pg_indexes WHERE schemaname='public') AS indices,
 ARRAY(SELECT tgname::text FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgenabled IN ('O','A')) AS gatilhos,
 ARRAY(SELECT conname::text FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public') AS restricoes,
 ARRAY(SELECT proname::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public') AS funcoes`;

export function listarManifesto(pasta = "db") {
 return readdirSync(pasta).filter(nome=>/^\d{3}_.+\.sql$/.test(nome)).sort()
  .map(nome=>{
   if (!marcas[nome.slice(0,3)]) throw new Error(`Assinatura de migração não definida para ${nome}.`);
   const texto=readFileSync(resolve(pasta,nome),"utf8");
   return {nome,checksum:createHash("sha256").update(texto).digest("hex"),texto};
  });
}

/** Uma assinatura comprova presença de objetos; não comprova equivalência semântica de funções nem histórico de dados. */
export function checarAssinatura(nome, inventario) {
 const assinatura=marcas[nome.slice(0,3)];
 if(!assinatura)throw new Error(`Assinatura ausente: ${nome}`);
 const ausentes=[],indevidos=[];
 let encontrados=0,total=0;
 for(const [tipo,valores] of Object.entries(assinatura)){
  if(tipo==="ausentes")continue;
  const disponiveis=new Set(inventario[tipo]??[]);
  for(const valor of valores){
   total++;
   if(disponiveis.has(valor))encontrados++;
   else ausentes.push(`${tipo}:${valor}`);
  }
 }
 for(const [tipo,valores] of Object.entries(assinatura.ausentes??{})){
  const disponiveis=new Set(inventario[tipo]??[]);
  for(const valor of valores)if(disponiveis.has(valor))indevidos.push(`${tipo}:${valor}`);
 }
 return {aplicada:ausentes.length===0&&indevidos.length===0,
         ausente:encontrados===0&&indevidos.length===0,
         faltantes:[...ausentes,...indevidos],encontrados,total};
}

export function relatorioMigracoes(manifesto,inventario,registros=[]) {
 const porNome=new Map(registros.map(r=>[r.nome,r.checksum]));
 return manifesto.map(({nome,checksum})=>{
  const assinatura=checarAssinatura(nome,inventario);
  const anterior=porNome.get(nome);
  const situacao=anterior!==undefined
   ? anterior===checksum
     ? assinatura.aplicada?"registrada":"estrutura_incompleta"
     : "checksum_divergente"
   : assinatura.aplicada?"sem_historico":assinatura.ausente?"pendente":"parcial";
  return {nome,checksum,situacao,...assinatura};
 });
}

/** Reconciliar somente o prefixo contínuo comprovadamente aplicado, sem inferir etapas faltantes. */
export function planejarReconciliacao(relatorio) {
 const novos=[];
 let houveLacuna=false;
 for(const linha of relatorio){
  if(["checksum_divergente","estrutura_incompleta","parcial"].includes(linha.situacao))
   throw new Error(`Migração ${linha.nome} com estado inseguro (${linha.situacao}); confira a estrutura manualmente.`);
  if(linha.situacao==="pendente"){houveLacuna=true;continue;}
  if(houveLacuna)throw new Error(`Migração ${linha.nome} aparece instalada depois de uma etapa pendente; reconciliação bloqueada.`);
  if(linha.situacao==="sem_historico")novos.push({nome:linha.nome,checksum:linha.checksum});
 }
 return novos;
}
