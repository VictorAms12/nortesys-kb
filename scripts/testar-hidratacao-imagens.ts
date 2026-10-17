import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConteudoMarkdown } from "../src/components/conteudo-markdown";
import { criarTextoDoFormulario, MODELO_CORPO } from "../src/lib/formulario-artigo";
import { validarTextoArtigo } from "../src/lib/artigos";

const url = "/imagens/manual-nortesys-piloto/pagina-001.webp";
const exemplos = [
  `![Captura de tela](${url})`,
  `**Imagem do procedimento:**\n\n![Captura](${url})`,
  `Texto antes ![Captura](${url}) texto depois.`,
  `1. Confira a tela\n\n   ![Captura](${url})`,
  `[![Captura](${url})](/artigos/cadastros/exemplo)`,
  `**![Captura](${url})**`,
  `*![Captura](${url})*`,
  `### ![Captura](${url})`,
  `| Print |\n| --- |\n| ![Captura](${url}) |`,
];
for (const [i, markdown] of exemplos.entries()) {
  const html = renderToStaticMarkup(createElement(ConteudoMarkdown, { markdown }));
  assert.match(html, /<img\b/, `Imagem ausente no caso ${i + 1}`);
  assert.ok(html.includes(`src="${url}"`), `URL direta ausente no caso ${i + 1}`);
  assert.doesNotMatch(html, /\/_next\/image/, "Imagens protegidas não devem passar pelo otimizador");
  assert.doesNotMatch(html, /<(?:a|strong|em|h3)\b[^>]*>(?:(?!<\/(?:a|strong|em|h3)>)[\s\S])*<(?:figure|div|dialog)\b/, `Bloco em conteúdo inline no caso ${i + 1}`);
  assert.doesNotMatch(html, /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<button\b/, "Botão aninhado em link");
  assert.doesNotMatch(html, /<dialog\b/, "Modal só deve montar ao ampliar");
  assert.doesNotMatch(html, /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*<(?:figure|div|dialog)\b/, `Elemento de bloco dentro de p no caso ${i + 1}`);
}
const texto = renderToStaticMarkup(createElement(ConteudoMarkdown, { markdown: "Paragrafo comum sem imagem." }));
assert.match(texto, /<p>Paragrafo comum sem imagem\.<\/p>/);
// Mesmo caminho de serialização/validação usado ao salvar, sem consultar o banco.
const formulario = new FormData();
for (const [campo, valor] of Object.entries({
  titulo: "Procedimento demonstrativo com imagem", resumo: "Teste local de preservação da referência da imagem.",
  categoria: "erp", slug: "teste-imagem-local", sistema: "Nortesys", nivel: "N1", status: "rascunho",
  revisarAte: "", tags: "teste", codigosErro: "", fonteOficial: "",
  conteudo: `${MODELO_CORPO}\n\n![Captura](${url})`,
})) formulario.set(campo, valor);
const salvo = criarTextoDoFormulario(formulario, "Colaborador de Teste");
const artigo = validarTextoArtigo("content/erp/teste-imagem-local.md", salvo.conteudo);
const htmlSalvo = artigo.secoes.map(secao => renderToStaticMarkup(createElement(ConteudoMarkdown, { markdown: secao.conteudo }))).join("");
assert.ok(htmlSalvo.includes(`src="${url}"`));
assert.doesNotMatch(htmlSalvo, /\/_next\/image/);
console.log("OK: URLs autenticadas diretas, HTML inline válido e referência preservada na serialização do artigo, sem banco.");
