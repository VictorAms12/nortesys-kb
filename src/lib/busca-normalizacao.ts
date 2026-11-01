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

const SIGLAS=new Set(["nfe","nfce","cfop","cst","csosn","ncm","xml","danfe","vpn","ibs","cbs","a1","a3"]);
/** Radical leve: não transformar dígitos ou siglas do suporte. */
export function radicalPortugues(original:string):string{
 const termo=normalizarTexto(original);
 if(!termo||termo.includes(" ")||/\d/.test(termo)||SIGLAS.has(termo)||/^[A-Z]{2,}$/.test(original))
   return termo;
 if(termo.length<5)return termo;
 if(termo.endsWith("coes"))return termo.slice(0,-4)+"cao";
 if(termo.endsWith("oes")||termo.endsWith("aes"))return termo.slice(0,-3)+"ao";
 for(const fim of ["ando","endo","indo"])if(termo.endsWith(fim))return termo.slice(0,-fim.length);
 for(const fim of ["ar","er","ir"])if(termo.endsWith(fim))return termo.slice(0,-2);
 if(termo.endsWith("s"))return termo.slice(0,-1);
 return termo;
}
export function radicalizarTexto(texto:string):string{
 return normalizarTexto(texto).split(" ").filter(Boolean).map(radicalPortugues).join(" ");
}
