/** Normalização única para texto do índice e consultas; nunca altera o conteúdo exibido. */
export function normalizarTexto(texto:string):string{
 let valor=texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
 valor=valor.replace(/\bnota\s+fiscal\s+(?:do\s+)?consumidor(?:\s+eletronica)?\b/g," nfce ");
 valor=valor.replace(/\bnota\s+fiscal\s+eletronica\b/g," nfe ");
 valor=valor.replace(/\bnfc[\s._-]*e\b/g," nfce ");
 valor=valor.replace(/\bnf[\s._-]*e\b/g," nfe ");
 return valor.replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
const STOPWORDS=new Set(["de","do","da","o","a","para","como","que","no","na","um","uma","com","em","se","por"]);
export function prepararConsulta(consulta:string):string{
 const texto=normalizarTexto(consulta.slice(0,120));
 const filtrados=texto.split(" ").filter(t=>t&&!STOPWORDS.has(t)).join(" ");
 return filtrados.length>=2?filtrados:texto;
}
export function normalizarCodigoErro(texto:string):string{
 return normalizarTexto(texto).replace(/^(?:erro|rejeicao)\s+(?=\d)/,"");
}
