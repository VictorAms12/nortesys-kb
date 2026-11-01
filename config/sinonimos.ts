/** Termos relacionados da equipe; grupos genéricos não substituem o termo exato. */
export type GrupoSinonimos={id:string;termos:readonly string[];observacao:string};
export const GRUPOS_SINONIMOS:readonly GrupoSinonimos[]=[
 {id:"impressao",termos:["impressora","impressão","imprimir","spooler","fila de impressão"],observacao:"Revisar com o time: fila/spooler descrevem subproblemas"},
 {id:"documentos_fiscais",termos:["NF-e","NFC-e","DANFE","XML","chave de acesso"],observacao:"Revisar com o time: termos relacionados, NÃO são equivalências fiscais"},
 {id:"tributacao",termos:["CFOP","CST","CSOSN","NCM"],observacao:"Revisar com o time: códigos distintos, usar somente como expansão secundária"},
 {id:"certificado",termos:["certificado digital","certificado A1","certificado A3","A1","A3"],observacao:"Revisar com o time: tipos não equivalentes"},
 {id:"cadastros",termos:["cadastro","cliente","fornecedor","produto"],observacao:"Revisar com o time: entidades distintas"},
 {id:"erro",termos:["erro","falha","problema","não abre","travou"],observacao:"Revisar com o time: causas distintas"},
 {id:"lento",termos:["lentidão","lento","demora"],observacao:"Sinônimos de desempenho a validar"},
 {id:"acesso",termos:["login","entrar sistema","acesso sistema"],observacao:"Equivalências de autenticação"},
 {id:"reforma",termos:["IBS CBS","IBSCBS","reforma tributária"],observacao:"Revisar com o time: contexto tributário amplo"}
] as const;
