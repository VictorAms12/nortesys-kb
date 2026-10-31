/** Separa SQL confiável do repositório sem quebrar funções PL/pgSQL com `;`. */
export function dividirInstrucoesSql(texto) {
  const comandos = [];
  let atual = "";
  let aspasSimples = false;
  let aspasDuplas = false;
  let comentarioLinha = false;
  let comentarioBloco = false;
  let marcadorDollar = null;

  for (let i = 0; i < texto.length; i++) {
    const caractere = texto[i];
    const proximo = texto[i + 1];

    if (comentarioLinha) {
      if (caractere === "\n") { comentarioLinha = false; atual += "\n"; }
      continue;
    }
    if (comentarioBloco) {
      if (caractere === "*" && proximo === "/") { comentarioBloco = false; i++; }
      continue;
    }
    if (marcadorDollar) {
      if (texto.startsWith(marcadorDollar, i)) {
        atual += marcadorDollar;
        i += marcadorDollar.length - 1;
        marcadorDollar = null;
      } else atual += caractere;
      continue;
    }
    if (aspasSimples) {
      atual += caractere;
      if (caractere === "'" && proximo === "'") { atual += proximo; i++; }
      else if (caractere === "'") aspasSimples = false;
      continue;
    }
    if (aspasDuplas) {
      atual += caractere;
      if (caractere === '"' && proximo === '"') { atual += proximo; i++; }
      else if (caractere === '"') aspasDuplas = false;
      continue;
    }
    if (caractere === "-" && proximo === "-") { comentarioLinha = true; i++; continue; }
    if (caractere === "/" && proximo === "*") { comentarioBloco = true; i++; continue; }
    if (caractere === "'") { aspasSimples = true; atual += caractere; continue; }
    if (caractere === '"') { aspasDuplas = true; atual += caractere; continue; }
    if (caractere === "$") {
      const match = /^\$[A-Za-z_0-9]*\$/.exec(texto.slice(i));
      if (match) { marcadorDollar = match[0]; atual += marcadorDollar; i += marcadorDollar.length - 1; continue; }
    }
    if (caractere === ";") {
      const instrucao = atual.trim();
      if (instrucao && !/^(BEGIN|COMMIT)$/i.test(instrucao)) comandos.push(instrucao);
      atual = "";
      continue;
    }
    atual += caractere;
  }
  if (marcadorDollar || aspasSimples || aspasDuplas || comentarioBloco)
    throw new Error("Migração SQL incompleta: verifique aspas, comentários ou delimitadores dollar.");
  const ultima = atual.trim();
  if (ultima && !/^(BEGIN|COMMIT)$/i.test(ultima)) comandos.push(ultima);
  return comandos;
}
