import type {MensagemChat} from "./chat-tipos";

/** Evita renderizar todo o histórico quando o polling devolve o mesmo conteúdo. */
export function mensagensIguais(a:MensagemChat[],b:MensagemChat[]):boolean{
 if(a===b)return true;
 if(a.length!==b.length)return false;
 return a.every((m,i)=>{
  const n=b[i];
  return m.id===n.id&&m.conversaId===n.conversaId&&m.autorId===n.autorId&&
   m.autor===n.autor&&m.texto===n.texto&&m.criadoEm===n.criadoEm&&
   m.apagadaParaTodos===n.apagadaParaTodos&&m.temImagem===n.temImagem&&
   m.respondendoAId===n.respondendoAId&&
   m.respostaA?.id===n.respostaA?.id&&m.respostaA?.autor===n.respostaA?.autor&&
   m.respostaA?.texto===n.respostaA?.texto;
 });
}
export function atualizarHistorico(anterior:MensagemChat[],recebidas:MensagemChat[],antes:number|null):MensagemChat[]{
 const proximas=antes===null?recebidas:(()=>{
  const ids=new Set(recebidas.map(m=>m.id));
  return [...recebidas,...anterior.filter(m=>!ids.has(m.id))];
 })();
 return mensagensIguais(anterior,proximas)?anterior:proximas;
}
