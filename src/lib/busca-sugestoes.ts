import type {DocumentoBusca} from "./indice-busca";
import {normalizarTexto,prepararConsulta,radicalPortugues} from "./busca-normalizacao";

const SIGLAS=new Set(["nfe","nfce","cfop","cst","csosn","ncm","xml","danfe","vpn","ibs","cbs","a1","a3"]);
export function codigoOuSigla(termo:string):boolean{
 return /\d/.test(termo)||SIGLAS.has(normalizarTexto(termo))||/^[A-Z]{2,}$/.test(termo);
}
export function toleranciaEdicao(termo:string):number{
 if(codigoOuSigla(termo)||termo.length<=3)return 0;
 return termo.length<=7?1:2;
}
export function distanciaEdicao(a:string,b:string,limite=2):number{
 if(a===b)return 0;
 if(Math.abs(a.length-b.length)>limite)return limite+1;
 let anterior=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const linha=[i];
  for(let j=1;j<=b.length;j++)
   linha[j]=Math.min(linha[j-1]+1,anterior[j]+1,anterior[j-1]+Number(a[i-1]!==b[j-1]));
  if(Math.min(...linha)>limite)return limite+1;
  anterior=linha;
 }
 return anterior[b.length];
}
export function tokensDocumento(doc:DocumentoBusca):string[]{
 const campos=[doc.titulo,doc.resumo,doc.sistema,doc.nomeCategoria,doc.conteudoBusca,
  ...(doc.tags??[]),...(doc.codigosErro??[])];
 return [...new Set(normalizarTexto(campos.join(" ")).split(" ").filter(t=>t.length>=2))];
}
export function confereTermos(documentoTokens:readonly string[],consulta:string):boolean{
 const termos=prepararConsulta(consulta).split(" ").filter(Boolean);
 return termos.every(t=>{
  const raiz=radicalPortugues(t),max=toleranciaEdicao(t);
  return documentoTokens.some(c=>c===t||(!codigoOuSigla(t)&&radicalPortugues(c)===raiz)||
   (max>0&&!codigoOuSigla(c)&&distanciaEdicao(t,c,max)<=max));
 });
}
export function criarVocabulario(documentos:DocumentoBusca[]):string[]{
 const itens=new Set<string>();
 for(const doc of documentos){
  const campos=[doc.titulo,doc.nomeCategoria,doc.sistema,...(doc.tags??[]),...(doc.codigosErro??[])];
  for(const campo of campos){
   const palavras=normalizarTexto(campo).split(" ");
   for(const token of palavras)
    if(token.length>=2&&token.length<=40&&itens.size<2500)itens.add(token);
  }
 }
 return [...itens].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
/** Nunca sugerir outra numeração de erro, sigla ou código fiscal. */
export function sugerirConsultas(consulta:string,vocabulario:readonly string[],limite=3):string[]{
 const base=prepararConsulta(consulta);
 if(base.length<2)return [];
 const tokens=base.split(" ");
 const candidatos:{texto:string;distancia:number}[]=[];
 for(let pos=0;pos<tokens.length;pos++){
  const t=tokens[pos],max=toleranciaEdicao(t);
  if(max===0)continue;
  for(const alternativa of vocabulario){
   if(alternativa===t||codigoOuSigla(alternativa))continue;
   const distancia=distanciaEdicao(t,alternativa,max);
   if(distancia>max)continue;
   const partes=[...tokens];partes[pos]=alternativa;
   candidatos.push({texto:partes.join(" "),distancia});
  }
 }
 return [...new Map(candidatos.sort((a,b)=>a.distancia-b.distancia||
  a.texto.localeCompare(b.texto,"pt-BR")).map(c=>[c.texto,c])).values()]
  .slice(0,limite).map(c=>c.texto);
}
