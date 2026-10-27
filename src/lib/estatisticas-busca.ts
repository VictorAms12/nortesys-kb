/** Não gravar dados pessoais, URLs ou sequências longas nas lacunas da busca. */
export function termoEstatisticoSeguro(valor:unknown):string|null{
 if(typeof valor!=="string")return null;
 const termo=valor.trim().replace(/\s+/g," ").toLocaleLowerCase("pt-BR").slice(0,90);
 if(termo.length<2||termo.length>90||!(/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u).test(termo))return null;
 if(/\d{5,}/.test(termo)||/\b\d{3}[- ]?\d{3}/.test(termo))return null;
 return termo;
}
