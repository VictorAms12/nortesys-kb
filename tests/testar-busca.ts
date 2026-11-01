import assert from "node:assert/strict";
import { carregarArtigos } from "../src/lib/artigos";
import { criarIndiceBusca } from "../src/lib/indice-busca";
import { criarBuscador, executarBusca, trechoEncontrado } from "../src/lib/busca";
import { artigoDeTeste } from "./fixtures/artigo-teste";

const artigos = carregarArtigos();
assert.equal(artigos.some(a => a.categoria === "cadastros" && a.slug === "cliente-duplicado"), false,
  "Artigo fictício removido não pode reaparecer no catálogo");
const docs = criarIndiceBusca([artigoDeTeste()]);
const fuse = criarBuscador(docs);
const esperado = "/artigos/erp/impressora-homologacao";
for (const termo of ["IMP-001", "impressora", "spooler", "fila", "impressão"]) {
  const resultado = executarBusca(fuse, termo);
  assert.equal(resultado[0]?.artigo.url, esperado, "Consulta falhou: " + termo);
  console.log("✓ Busca de teste por '" + termo + "'");
}
assert.deepEqual(executarBusca(fuse, " "), []);
assert.deepEqual(executarBusca(fuse, "a"), []);
assert.ok(trechoEncontrado(docs[0].conteudoBusca, "spooler").length > 0);
assert.ok(docs[0].conteudoBusca.includes("Encaminhe ao N2"),
  "A pesquisa deve indexar a última seção do artigo.");
console.log("✓ Busca, estados vazios e corpo completo verificados com fixture em memória.");
