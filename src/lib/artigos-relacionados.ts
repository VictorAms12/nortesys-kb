import type {Artigo} from "../types/artigo";
function normalizar(valor:string):string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
}
function tokens(titulo:string):Set<string> {
  const ignorar=new Set(["para","como","onde","com","erro","sistema","artigo","problema","guia","passo","passos","procedimento","nortesys"]);
  return new Set(normalizar(titulo).split(/[^a-z0-9]+/).filter(p=>p.length>=4&&!ignorar.has(p)));
}
/** Relevância explícita: códigos e tags prevalecem sobre semelhança genérica de categoria. */
export function sugerirArtigosRelacionados(atual:Artigo,artigos:Artigo[],limite=4):Artigo[]{
  const tagAtual=new Set(atual.tags.map(normalizar));
  const codigos=new Set((atual.codigosErro??[]).map(normalizar));
  const titulo=tokens(atual.titulo);
  return artigos.filter(a=>a.url!==atual.url&&a.status!=="rascunho").map(a=>{
    const tagsEmComum=a.tags.filter(t=>tagAtual.has(normalizar(t))).length;
    const codigosEmComum=(a.codigosErro??[]).filter(c=>codigos.has(normalizar(c))).length;
    const palavras=[...tokens(a.titulo)].filter(t=>titulo.has(t)).length;
    const contexto=a.categoria===atual.categoria?1:0;
    const sistema=normalizar(a.sistema)===normalizar(atual.sistema)?1:0;
    const pontuacao=codigosEmComum*8+tagsEmComum*4+palavras*2+contexto+sistema;
    const evidencias=codigosEmComum>0||tagsEmComum>0||palavras>=2;
    return {a,pontuacao,evidencias};
  }).filter(x=>x.evidencias&&x.pontuacao>=4).sort((a,b)=>b.pontuacao-a.pontuacao||a.a.titulo.localeCompare(b.a.titulo,"pt-BR"))
    .slice(0,limite).map(x=>x.a);
}
