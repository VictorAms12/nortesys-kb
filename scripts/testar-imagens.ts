import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { criarRotasImagens, type ContaImagem, type DependenciasImagens } from "../src/lib/imagens-servico";
import { criarRepositorioImagens } from "../src/lib/imagens-repositorio";
import { criarArmazenamentoBlob } from "../src/lib/imagens-blob";
import { inserirReferenciaImagem, TAMANHO_MAXIMO_IMAGEM } from "../src/lib/imagens";
import { validarImagem } from "../src/lib/imagens-validacao";
import { ConteudoMarkdown } from "../src/components/conteudo-markdown";
import { EditorMarkdown } from "../src/components/editor-markdown";
import { criarTextoDoFormulario, MODELO_CORPO } from "../src/lib/formulario-artigo";
import { validarTextoArtigo } from "../src/lib/artigos";
import { diagnosticoImagem } from "../src/lib/imagens-diagnostico";
import { BlobAccessError } from "@vercel/blob";

test("diagnóstico distingue configuração e banco sem revelar dados do erro", () => {
  const marcadorPrivado = "CONTEUDO-PRIVADO-QUE-NAO-DEVE-SAIR";
  for (const [falha, codigo] of [
    [new Error(`No blob credentials found ${marcadorPrivado}`), "BLOB_CREDENCIAIS_AUSENTES"],
    [new Error(`OIDC is enabled for this project, but not for this token's environment. ${marcadorPrivado}`), "BLOB_OIDC_AMBIENTE_NAO_PERMITIDO"],
    [new Error(`Token expired ${marcadorPrivado}`), "BLOB_CREDENCIAL_EXPIRADA"],
    [new BlobAccessError(), "BLOB_ACESSO_NEGADO"],
    [new Error(marcadorPrivado), "BLOB_FALHA_NAO_IDENTIFICADA"],
  ] as const) {
    const diagnostico = diagnosticoImagem(falha, "blob_gravar");
    assert.deepEqual(diagnostico, { etapa: "blob_gravar", codigo });
    assert.ok(!JSON.stringify(diagnostico).includes(marcadorPrivado));
  }
  assert.equal(diagnosticoImagem(new Error(marcadorPrivado), "banco_confirmar").codigo, "IMAGEM_BANCO_CONFIRMACAO");
});

test("Fase 7C.1: PostgreSQL em memória e Blob simulado; nenhuma conexão externa", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  for (const arquivo of ["001_auth", "002_painel", "003_interacoes", "004_imagens"]) {
    await db.exec(readFileSync(`db/${arquivo}.sql`, "utf8"));
  }
  // Reaplicar a migração não modifica artigos nem dados de imagens.
  await db.exec(readFileSync("db/004_imagens.sql", "utf8"));
  const consultar = async <T,>(sql: string, parametros: unknown[] = []) => (await db.query<T>(sql, parametros)).rows;
  async function usuario(papel: ContaImagem["papel"]): Promise<ContaImagem> {
    const id = randomUUID();
    await db.query(`INSERT INTO kb_usuarios(id,usuario,nome,papel,senha_salt,senha_hash) VALUES ($1,$2,'Teste',$3,$4,$5)`,
      [id, `u${id.slice(0, 8)}`, papel, "a".repeat(32), "b".repeat(128)]);
    return { id, papel };
  }
  const editor = await usuario("editor"), admin = await usuario("administrador"), leitor = await usuario("leitor"), outroEditor = await usuario("editor");
  let conta: ContaImagem | null = editor;
  const objetos = new Map<string, { bytes: Uint8Array; mime: string }>();
  let leiturasBlob = 0;
  const armazenamento = criarArmazenamentoBlob({
    put: async (pathname, body, options) => {
      assert.equal(options.access, "private");
      assert.equal(options.allowOverwrite, false);
      assert.equal(options.addRandomSuffix, false);
      assert.equal(options.token, undefined, "SDK deve resolver a autenticação da integração, incluindo OIDC");
      assert.ok(body instanceof Uint8Array);
      objetos.set(pathname, { bytes: Uint8Array.from(body), mime: options.contentType! });
      return { url: `https://store.private.blob.vercel-storage.com/${pathname}`, downloadUrl: "https://store.private.blob.vercel-storage.com/download",
        pathname, contentType: options.contentType!, contentDisposition: "inline", etag: "teste" };
    },
    del: async pathname => { assert.equal(typeof pathname, "string"); objetos.delete(pathname as string); },
    get: async (pathname, options) => {
      assert.equal(options.access, "private");
      leiturasBlob++;
      const objeto = objetos.get(pathname);
      if (!objeto) return null;
      return { statusCode: 200, stream: new ReadableStream({ start(c) { c.enqueue(objeto.bytes); c.close(); } }),
        headers: new Headers({ "x-blob-private-url": "deve-ser-descartado" }),
        blob: { url: "https://store.private.blob.vercel-storage.com/privado", downloadUrl: "https://store.private.blob.vercel-storage.com/privado",
          pathname, contentDisposition: "inline", cacheControl: "public", uploadedAt: new Date(), etag: "teste",
          contentType: objeto.mime, size: objeto.bytes.length } };
    },
  });
  const repo = criarRepositorioImagens(consultar);
  const dep: DependenciasImagens = { ...repo, ...armazenamento, sessao: async () => conta };
  const rotas = criarRotasImagens(dep);
  const png = await sharp({ create: { width: 16, height: 12, channels: 3, background: "#158080" } }).png().toBuffer();
  function requisicao(bytes: Uint8Array = png, mime = "image/png", origem = "http://localhost:3000") {
    const form = new FormData();
    form.set("imagem", new File([new Uint8Array(bytes)], "captura.png", { type: mime }));
    form.set("alt", "Tela [Clientes] (teste)");
    return new NextRequest("http://localhost:3000/api/admin/imagens", { method: "POST", headers: { host: "localhost:3000", origin: origem }, body: form });
  }
  const reqLeitura = () => new NextRequest("http://localhost:3000/api/imagens/teste");
  async function upload(ator = editor) {
    conta = ator;
    const resposta = await rotas.enviar(requisicao());
    assert.equal(resposta.status, 201, await resposta.clone().text());
    const retorno = await resposta.json() as { id: string; url: string; alt: string };
    assert.deepEqual(Object.keys(retorno).sort(), ["alt", "id", "url"]);
    assert.equal(retorno.url, `/api/imagens/${retorno.id}`);
    assert.equal(retorno.alt, "Tela Clientes teste");
    assert.doesNotMatch(JSON.stringify(retorno), /blob\.vercel|token|kb-imagens/);
    return retorno;
  }
  let primeira: Awaited<ReturnType<typeof upload>>;
  await t.test("falhas antes do Blob identificam etapa e migração sem expor o erro", async () => {
    for (const etapa of ["banco_cota", "banco_inserir"] as const) {
      const diagnosticos: unknown[] = [];
      const falhar = async () => { throw Object.assign(new Error("SEGREDO-DO-BANCO"), { code: "42P01" }); };
      const resposta = await criarRotasImagens({ ...dep,
        reservarCota: etapa === "banco_cota" ? falhar : async () => true,
        inserir: etapa === "banco_inserir" ? falhar : dep.inserir,
        gravar: async () => { assert.fail("Não deve acessar o Blob após falha no banco"); },
        diagnosticar: dado => diagnosticos.push(dado),
      }).enviar(requisicao());
      assert.equal(resposta.status, 503);
      const corpo = await resposta.text();
      assert.match(corpo, /IMAGEM_BANCO_MIGRACAO_INCOMPATIVEL/);
      assert.doesNotMatch(corpo, /SEGREDO-DO-BANCO/);
      assert.deepEqual(diagnosticos, [{ etapa, codigo: "IMAGEM_BANCO_MIGRACAO_INCOMPATIVEL" }]);
    }
  });
  await t.test("editor e administrador enviam; metadados e objeto persistem entre requisições", async () => {
    primeira = await upload();
    const registro = await repo.obter(primeira.id);
    assert.equal(registro?.estado, "pronta");
    assert.equal(registro?.usuario_id, editor.id);
    assert.equal(registro?.artigo_id, null);
    const independente = criarRotasImagens(dep);
    const resposta = await independente.ler(reqLeitura(), primeira.id);
    assert.equal(resposta.status, 200);
    assert.deepEqual(Buffer.from(await resposta.arrayBuffer()), Buffer.from(objetos.get(registro!.blob_caminho)!.bytes));
    assert.equal(resposta.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(resposta.headers.get("vary"), "Cookie");
    assert.equal(resposta.headers.get("x-blob-private-url"), null);
    assert.equal(resposta.headers.get("location"), null);
    await upload(admin);
  });
  await t.test("sem sessão/leitor/origem externa não enviam; órfãos só são vistos pelo autor", async () => {
    conta = null; assert.equal((await rotas.enviar(requisicao())).status, 401);
    assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 401);
    conta = leitor; assert.equal((await rotas.enviar(requisicao())).status, 403);
    const antes = leiturasBlob;
    for (const ator of [leitor, admin, outroEditor]) {
      conta = ator; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 404);
    }
    assert.equal(leiturasBlob, antes, "Acesso negado não deve buscar o Blob");
    conta = editor;
    assert.equal((await rotas.enviar(requisicao(png, "image/png", "https://externo.test"))).status, 403);
    assert.equal((await rotas.ler(reqLeitura(), "../../arquivo")).status, 404);
  });
  await t.test("rejeita MIME falso, assinaturas forjadas, SVG/HTML, vazios e excesso de tamanho", async () => {
    conta = editor;
    const antes = objetos.size;
    for (const [bytes, mime, status] of [
      [png, "image/jpeg", 415], [png.subarray(0, 24), "image/png", 415],
      [Buffer.from("<svg></svg>"), "image/svg+xml", 415], [Buffer.from("<html>teste</html>"), "image/png", 415],
      [new Uint8Array(), "image/png", 413], [new Uint8Array(TAMANHO_MAXIMO_IMAGEM + 1), "image/png", 413],
    ] as const) assert.equal((await rotas.enviar(requisicao(bytes, mime))).status, status);
    assert.equal(objetos.size, antes);
    const comLixo = Buffer.concat([png, Buffer.from("<html>remover dados adicionais</html>")]);
    const normalizada = await validarImagem(comLixo, "image/png");
    assert.ok(!normalizada.bytes.includes(Buffer.from("<html>")));
    for (const formato of ["jpeg", "webp"] as const) {
      const bytes = await sharp(png).toFormat(formato).toBuffer();
      assert.equal((await rotas.enviar(requisicao(bytes, `image/${formato}`))).status, 201);
    }
  });
  await t.test("limita o corpo sem Content-Length e rejeita multipart malformado", async () => {
    conta = await usuario("editor");
    const antes = objetos.size;
    const headers = { host: "localhost:3000", origin: "http://localhost:3000", "content-type": "multipart/form-data; boundary=teste" };
    const enorme = new NextRequest("http://localhost:3000/api/admin/imagens", {
      method: "POST", headers, body: new Uint8Array(TAMANHO_MAXIMO_IMAGEM + 32_769),
    });
    assert.equal(enorme.headers.get("content-length"), null);
    assert.equal((await rotas.enviar(enorme)).status, 413);
    const malformado = new NextRequest("http://localhost:3000/api/admin/imagens", { method: "POST", headers, body: "multipart inválido" });
    assert.equal((await rotas.enviar(malformado)).status, 400);
    const declarado = requisicao(); declarado.headers.set("content-length", String(TAMANHO_MAXIMO_IMAGEM + 32_769));
    assert.equal((await rotas.enviar(declarado)).status, 413);
    assert.equal(objetos.size, antes);
  });
  const artigoId = randomUUID();
  await t.test("associação atômica ao salvar e leitor bloqueado no rascunho", async () => {
    const form = new FormData();
    for (const [chave, valor] of Object.entries({ titulo: "Teste de imagens privadas", resumo: "Procedimento demonstrativo com captura de tela.",
      categoria: "erp", slug: "teste-imagens-privadas", sistema: "Nortesys", nivel: "N1", status: "rascunho", tags: "teste",
      revisarAte: "", codigosErro: "", fonteOficial: "", conteudo: `${MODELO_CORPO}\n\n![Print](${primeira.url})` })) form.set(chave, valor);
    const salvo = criarTextoDoFormulario(form, "Colaborador de Teste");
    const validado = validarTextoArtigo("content/erp/teste-imagens-privadas.md", salvo.conteudo);
    assert.ok(validado.secoes.some(secao => renderToStaticMarkup(createElement(ConteudoMarkdown, { markdown: secao.conteudo })).includes(`src="${primeira.url}"`)));
    await db.query(`WITH novo AS (INSERT INTO kb_artigos(id,categoria,slug,titulo,status,conteudo,criado_por,atualizado_por)
      VALUES ($1,'erp','teste-imagens-privadas','Teste','rascunho',$2,$3,$3) RETURNING id,versao,conteudo)
      INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao,editor_id)
      SELECT id,versao,conteudo,'criado',$3 FROM novo`, [artigoId, salvo.conteudo, editor.id]);
    assert.equal((await repo.obter(primeira.id))?.artigo_id, artigoId);
    conta = leitor; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 404);
    for (const ator of [editor, admin, outroEditor]) {
      conta = ator; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 200);
    }
    await db.query("UPDATE kb_artigos SET status='revisado' WHERE id=$1", [artigoId]);
    conta = leitor; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 200);
    await db.query("UPDATE kb_artigos SET status='rascunho' WHERE id=$1", [artigoId]);
    assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 404, "Não reutilizar permissão após despublicação");
    await db.query("UPDATE kb_artigos SET status='revisado', arquivado=true WHERE id=$1", [artigoId]);
    assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 404);
    await db.query("UPDATE kb_artigos SET arquivado=false WHERE id=$1", [artigoId]);
  });
  await t.test("imagens removidas ficam no histórico e não vazam ao leitor", async () => {
    await db.query(`WITH alterado AS (UPDATE kb_artigos SET conteudo=$2,versao=versao+1 WHERE id=$1 RETURNING *)
      INSERT INTO kb_artigo_versoes(artigo_id,versao,conteudo,acao,editor_id) SELECT id,versao,conteudo,'editado',$3 FROM alterado`,
      [artigoId, MODELO_CORPO, editor.id]);
    assert.equal((await repo.obter(primeira.id))?.artigo_id, artigoId);
    assert.equal((await consultar<{ total: number }>("SELECT count(*)::int AS total FROM kb_artigo_versoes WHERE artigo_id=$1", [artigoId]))[0].total, 2);
    conta = leitor; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 404);
    conta = editor; assert.equal((await rotas.ler(reqLeitura(), primeira.id)).status, 200);
  });
  await t.test("não permite roubar upload, reaproveitar imagem de outro artigo ou salvar referência inexistente", async () => {
    const alheia = await upload(outroEditor);
    for (const id of [alheia.id, randomUUID()]) {
      await assert.rejects(db.query("UPDATE kb_artigos SET conteudo=$2,atualizado_por=$3 WHERE id=$1", [artigoId, `![Print](/api/imagens/${id})`, editor.id]),
        (erro: unknown) => !!erro && typeof erro === "object" && "constraint" in erro && erro.constraint === "kb_imagens_referencia");
    }
    await assert.rejects(db.query(`INSERT INTO kb_artigos(categoria,slug,titulo,status,conteudo,atualizado_por)
      VALUES ('erp','copia','Copia','revisado',$1,$2)`, [`![Print](${primeira.url})`, editor.id]));
    assert.equal((await repo.obter(alheia.id))?.artigo_id, null);
    const artigo = (await consultar<{ conteudo: string }>("SELECT conteudo FROM kb_artigos WHERE id=$1", [artigoId]))[0];
    assert.equal(artigo.conteudo, MODELO_CORPO, "Falha não altera o artigo existente");
    // Uma falha depois de associar também desfaz os vínculos e a versão inteira.
    await assert.rejects(db.exec(`BEGIN;
      UPDATE kb_artigos SET conteudo='![Print](${alheia.url})',atualizado_por='${outroEditor.id}' WHERE id='${artigoId}';
      SELECT 1/0; COMMIT;`));
    await db.exec("ROLLBACK");
    assert.equal((await repo.obter(alheia.id))?.artigo_id, null);
  });
  await t.test("falhas parciais: não deixa upload visível, compensa Blob e rastreia limpeza pendente", async () => {
    conta = editor;
    const antes = objetos.size;
    const falhaMetadados = criarRotasImagens({ ...dep, inserir: async () => { throw new Error("banco indisponível"); } });
    assert.equal((await falhaMetadados.enviar(requisicao())).status, 503);
    assert.equal(objetos.size, antes, "Não envia ao Blob antes de reservar os metadados");
    const falhaConfirmacao = criarRotasImagens({ ...dep, estado: async (id, estado) => {
      if (estado === "pronta") throw new Error("falha na confirmação");
      await repo.estado(id, estado);
    } });
    assert.equal((await falhaConfirmacao.enviar(requisicao())).status, 503);
    assert.equal(objetos.size, antes, "Exclui somente o objeto deste upload");
    const falhaLimpeza = criarRotasImagens({ ...dep, gravar: async (caminho, bytes, mime) => {
      await dep.gravar(caminho, bytes, mime); throw new Error("timeout depois do PUT");
    }, apagar: async () => { throw new Error("storage indisponível"); } });
    assert.equal((await falhaLimpeza.enviar(requisicao())).status, 503);
    const pendentes = await consultar<{ id: string }>("SELECT id FROM kb_imagens WHERE estado='limpeza_pendente'");
    assert.equal(pendentes.length, 1);
    assert.equal((await rotas.ler(reqLeitura(), pendentes[0].id)).status, 404);
  });
  await t.test("cota compartilhada é atômica e reinicia após uma hora", async () => {
    const novoEditor = await usuario("editor");
    const resultados = await Promise.all(Array.from({ length: 25 }, () => repo.reservarCota(novoEditor.id)));
    assert.equal(resultados.filter(Boolean).length, 20);
    conta = novoEditor;
    assert.equal((await rotas.enviar(requisicao())).status, 429);
    await db.query("UPDATE kb_imagem_limites SET janela_em=NOW()-INTERVAL '61 minutes' WHERE usuario_id=$1", [novoEditor.id]);
    assert.equal(await repo.reservarCota(novoEditor.id), true);
  });
  await t.test("editor insere na seleção sem truncar URL; prévia privada e imagens antigas continuam válidas", () => {
    const inserido = inserirReferenciaImagem("antesSELECAOdepois", 5, 12, primeira.url, "Tela [Clientes]");
    assert.ok(inserido.conteudo.startsWith("antes\n\n![Tela Clientes]"));
    assert.ok(inserido.conteudo.endsWith("\n\ndepois"));
    assert.throws(() => inserirReferenciaImagem("x".repeat(60000), 0, 0, primeira.url, "teste"));
    assert.throws(() => inserirReferenciaImagem("texto", 0, 0, "https://externo.test/a.png", "teste"));
    for (const url of [primeira.url, "/imagens/antiga.webp", "/imagens/uploads-locais/antiga.png"]) {
      const html = renderToStaticMarkup(createElement(ConteudoMarkdown, { markdown: `**![Print](${url})**` }));
      assert.ok(html.includes(`src="${url}"`)); assert.doesNotMatch(html, /\/_next\/image|<dialog\b|<figure\b/);
    }
    const editorHtml = renderToStaticMarkup(createElement(EditorMarkdown, { conteudoInicial: MODELO_CORPO, tipoInicial: "solucao", chave: "teste", editando: false }));
    assert.match(editorHtml, /Enviar print/); assert.match(editorHtml, /Descrição alternativa/);
  });
  await t.test("reaplicar a migração preserva artigos, metadados e histórico existentes", async () => {
    const antesArtigos = await consultar("SELECT * FROM kb_artigos ORDER BY id");
    const antesVersoes = await consultar("SELECT * FROM kb_artigo_versoes ORDER BY artigo_id,versao");
    const antesImagens = await consultar("SELECT * FROM kb_imagens ORDER BY id");
    await db.exec(readFileSync("db/004_imagens.sql", "utf8"));
    assert.deepEqual(await consultar("SELECT * FROM kb_artigos ORDER BY id"), antesArtigos);
    assert.deepEqual(await consultar("SELECT * FROM kb_artigo_versoes ORDER BY artigo_id,versao"), antesVersoes);
    assert.deepEqual(await consultar("SELECT * FROM kb_imagens ORDER BY id"), antesImagens);
  });
});
