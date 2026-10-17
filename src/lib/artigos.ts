import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import { categorias } from "../../config/categorias";
import { type Artigo, type SecaoArtigo } from "../types/artigo";
import { artigoFrontmatterSchema } from "./schema-artigo";
import { TIPOS_CONTEUDO, type TipoConteudo } from "./tipos-conteudo";

const PASTA_CONTEUDO = resolve(process.cwd(), "content");
const PADRAO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Erro legível no PowerShell, com arquivo e campo que precisam ser corrigidos. */
export class ErroConteudo extends Error {
  constructor(caminho: string, problemas: string[]) {
    super(
      `\n❌ Conteúdo inválido: ${caminho}\n` +
        problemas.map((problema) => `  • ${problema}`).join("\n") +
        "\n",
    );
    this.name = "ErroConteudo";
  }
}

/** Converte apenas o texto de um título Markdown para comparação. */
function textoTitulo(no: unknown): string {
  if (!no || typeof no !== "object") return "";
  const item = no as { value?: unknown; children?: unknown[] };
  if (typeof item.value === "string") return item.value;
  return Array.isArray(item.children)
    ? item.children.map(textoTitulo).join("")
    : "";
}

function normalizarTitulo(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function validarSecoes(markdown: string, caminho: string, tipo: TipoConteudo): SecaoArtigo[] {
  const secoesEsperadas: readonly string[] = TIPOS_CONTEUDO[tipo].secoes;
  // remark distingue títulos verdadeiros de texto em blocos de código.
  const arvore = remark().parse(markdown);
  const titulos = arvore.children.filter(
    (no) => no.type === "heading" && no.depth === 2,
  );
  const problemas: string[] = [];

  if (titulos.length !== secoesEsperadas.length) {
    problemas.push(
      `corpo: esperadas ${secoesEsperadas.length} seções '##', encontradas ${titulos.length}`,
    );
  }

  for (let indice = 0; indice < secoesEsperadas.length; indice++) {
    const tituloEncontrado = titulos[indice];
    const esperado = secoesEsperadas[indice];

    if (!tituloEncontrado) {
      problemas.push(`corpo.seção ${indice + 1}: falta '## ${esperado}'`);
      continue;
    }

    const encontrado = textoTitulo(tituloEncontrado);
    if (normalizarTitulo(encontrado) !== normalizarTitulo(esperado)) {
      problemas.push(
        `corpo.seção ${indice + 1}: esperado '## ${esperado}', encontrado '## ${encontrado}'` +
          (tituloEncontrado.position?.start.line
            ? ` (linha ${tituloEncontrado.position.start.line})`
            : ""),
      );
    }
  }

  const primeiraPosicao = titulos[0]?.position?.start.offset;
  if (
    primeiraPosicao !== undefined &&
    markdown.slice(0, primeiraPosicao).trim().length > 0
  ) {
    problemas.push("corpo: coloque o conteúdo apenas dentro das sete seções '##'");
  }

  const secoes: SecaoArtigo[] = [];
  for (let indice = 0; indice < titulos.length; indice++) {
    const atual = titulos[indice];
    const inicio = atual.position?.end.offset;
    const fim = titulos[indice + 1]?.position?.start.offset ?? markdown.length;
    const conteudo = inicio === undefined ? "" : markdown.slice(inicio, fim).trim();
    if (!conteudo) {
      problemas.push(`corpo.seção ${indice + 1}: não pode estar vazia`);
    }
    // Só criamos a seção estruturada quando temos o título correspondente.
    if (indice < secoesEsperadas.length) {
      secoes.push({ titulo: secoesEsperadas[indice], conteudo });
    }
  }

  if (problemas.length > 0) throw new ErroConteudo(caminho, problemas);
  return secoes;
}

/** Pode ser usado por testes em memória e pela leitura de arquivos reais. */
export function validarTextoArtigo(caminho: string, texto: string): Artigo {
  let dados: unknown;
  let corpo: string;
  try {
    const resultado = matter(texto);
    dados = resultado.data;
    corpo = resultado.content;
  } catch (erro) {
    throw new ErroConteudo(caminho, [
      `frontmatter: YAML inválido (${erro instanceof Error ? erro.message : String(erro)})`,
    ]);
  }

  const parseado = artigoFrontmatterSchema.safeParse(dados);
  if (!parseado.success) {
    throw new ErroConteudo(
      caminho,
      parseado.error.issues.map((erro) =>
        `frontmatter.${erro.path.join(".") || "raiz"}: ${erro.message}`,
      ),
    );
  }

  const categoria = parseado.data.categoria;
  const pastaEsperada = categoria;
  // O caminho é recebido em formato relativo 'content/categoria/slug.md'.
  const partes = caminho.replaceAll("\\", "/").split("/");
  const nomeArquivo = partes.at(-1) ?? "";
  const nomePasta = partes.at(-2) ?? "";
  const slug = basename(nomeArquivo, ".md");
  const problemas: string[] = [];

  if (nomePasta !== pastaEsperada) {
    problemas.push(
      `frontmatter.categoria: '${categoria}' não corresponde à pasta '${nomePasta}' (mova para content/${categoria}/)`,
    );
  }
  if (!PADRAO_SLUG.test(slug) || !nomeArquivo.endsWith(".md")) {
    problemas.push(
      `arquivo: use nome em kebab-case, sem acentos (ex.: cliente-duplicado.md)`,
    );
  }
  if (problemas.length > 0) throw new ErroConteudo(caminho, problemas);

  const secoes = validarSecoes(corpo, caminho, parseado.data.tipo);
  return {
    ...parseado.data,
    slug,
    caminho,
    url: `/artigos/${categoria}/${slug}`,
    markdown: corpo,
    secoes,
  };
}

/**
 * Lê os arquivos .md direto de content/<categoria>/.
 * Não busca dados na internet nem utiliza banco de dados.
 * O modelo _modelo-artigo.md (fase 6) será ignorado por começar com _.
 */
export function carregarArtigos(): Artigo[] {
  if (!existsSync(PASTA_CONTEUDO)) {
    throw new ErroConteudo("content/", ["a pasta content não existe"]);
  }

  const permitidas = new Set<string>(categorias.map((item) => item.slug));
  const artigos: Artigo[] = [];

  for (const entrada of readdirSync(PASTA_CONTEUDO, { withFileTypes: true })) {
    if (entrada.isDirectory()) {
      if (!permitidas.has(entrada.name)) {
        const arquivos = readdirSync(join(PASTA_CONTEUDO, entrada.name));
        if (arquivos.some((nome) => nome.endsWith(".md"))) {
          throw new ErroConteudo(`content/${entrada.name}/`, [
            `categoria desconhecida: cadastre primeiro em config/categorias.ts`,
          ]);
        }
        continue;
      }

      const pasta = join(PASTA_CONTEUDO, entrada.name);
      for (const arquivo of readdirSync(pasta).sort()) {
        if (!arquivo.endsWith(".md") || arquivo.startsWith("_")) continue;
        const caminhoCompleto = join(pasta, arquivo);
        if (!statSync(caminhoCompleto).isFile()) {
          throw new ErroConteudo(`content/${entrada.name}/${arquivo}`, [
            "somente arquivos Markdown são aceitos diretamente na pasta da categoria",
          ]);
        }
        const caminho = relative(process.cwd(), caminhoCompleto).replaceAll("\\", "/");
        artigos.push(validarTextoArtigo(caminho, readFileSync(caminhoCompleto, "utf8")));
      }
    } else if (entrada.name.endsWith(".md") && !entrada.name.startsWith("_")) {
      throw new ErroConteudo(`content/${entrada.name}`, [
        "coloque o artigo em content/<categoria>/<slug>.md",
      ]);
    }
  }

  return artigos.sort((a, b) =>
    b.atualizadoEm.localeCompare(a.atualizadoEm) || a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

/** Útil para contar documentos por categoria durante o build. */
export function contarPorCategoria(artigos: Artigo[]) {
  return categorias.map((categoria) => ({
    ...categoria,
    quantidade: artigos.filter((artigo) => artigo.categoria === categoria.slug).length,
  }));
}
