import assert from "node:assert/strict";
import { test } from "node:test";
import { artigoDeTeste, textoArtigoDeTeste } from "./fixtures/artigo-teste";
import { combinarArtigos } from "../src/lib/artigos-visibilidade";
import { lerPreferencia, salvarPreferencia } from "../src/lib/preferencias-navegador";
import matter from "gray-matter";

test("banco oculta cópia local arquivada ou em rascunho; leitores não recebem rascunhos", () => {
  const local = artigoDeTeste();
  assert.ok(local);
  const conteudo = textoArtigoDeTeste();
  const registro = { categoria: local.categoria, slug: local.slug, status: local.status, conteudo, arquivado: true };
  for (const papel of ["leitor", "editor", "administrador"] as const) {
    assert.equal(combinarArtigos([local], [registro], papel).length, 0);
  }
  assert.equal(combinarArtigos([local], [{ ...registro, arquivado: false, status: "rascunho" }], "leitor").length, 0);
  assert.equal(combinarArtigos([{ ...local, status: "rascunho" }], [], "leitor").length, 0);
  assert.equal(combinarArtigos([{ ...local, status: "rascunho" }], [], "editor").length, 1);
  assert.equal(combinarArtigos([local], [{ ...registro, arquivado: false }], "editor").length, 1);
  const publicado = { ...registro, arquivado: false, status: "revisado" as const,
    conteudo: matter.stringify(matter(conteudo).content, { ...matter(conteudo).data, status: "revisado", titulo: "Versão publicada do banco" }) };
  const visiveis = combinarArtigos([local], [publicado], "leitor");
  assert.equal(visiveis.length, 1);
  assert.equal(visiveis[0].titulo, "Versão publicada do banco");
  assert.equal(local.slug, registro.slug, "Não modifica a fonte local");
});

test("preferências funcionam com storage bloqueado e sincronizam quando disponível", () => {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      get localStorage() { throw new Error("Storage bloqueado"); },
    } });
    assert.equal(lerPreferencia("teste-tema"), null);
    salvarPreferencia("teste-tema", "escuro");
    assert.equal(lerPreferencia("teste-tema"), "escuro");
    const dados = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: (chave: string) => dados.get(chave) ?? null,
      setItem: (chave: string, valor: string) => dados.set(chave, valor),
    } } });
    salvarPreferencia("teste-tema", "claro");
    assert.equal(lerPreferencia("teste-tema"), "claro");
    dados.set("teste-tema", "sistema");
    assert.equal(lerPreferencia("teste-tema"), "sistema");
  } finally {
    if (anterior) Object.defineProperty(globalThis, "window", anterior);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
