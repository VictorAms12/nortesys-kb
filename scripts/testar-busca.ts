import assert from "node:assert/strict";
import { carregarArtigos } from "../src/lib/artigos";
import { criarIndiceBusca } from "../src/lib/indice-busca";
import { criarBuscador, executarBusca, trechoEncontrado } from "../src/lib/busca";

const artigos = carregarArtigos();
const docs = criarIndiceBusca(artigos);
const fuse = criarBuscador(docs);
const esperado = "/artigos/cadastros/cliente-duplicado";

for (const termo of ["CLI-DUP-001", "cliente", "duplicidade", "cadastro duplicado", "permissão", "operador"]) {
  const resultado = executarBusca(fuse, termo);
  assert.equal(resultado[0]?.artigo.url, esperado, `Consulta falhou: ${termo}`);
  console.log(`✓ Busca por '${termo}'`);
}
assert.deepEqual(executarBusca(fuse, " "), []);
assert.deepEqual(executarBusca(fuse, "a"), []);
assert.ok(trechoEncontrado(docs[0].conteudoBusca, "operador").length > 0);
assert.ok(docs[0].conteudoBusca.includes("Encaminhe ao N2"), "A pesquisa deve indexar a última seção do artigo.");
console.log(`✓ ${docs.length} artigo(s) indexado(s), estados vazios e corpo completo verificados.`);
