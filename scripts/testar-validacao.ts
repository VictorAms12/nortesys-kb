import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { carregarArtigos, validarTextoArtigo } from "../src/lib/artigos";

const caminho = "content/cadastros/cliente-duplicado.md";
const textoValido = readFileSync(resolve(caminho), "utf8");

function testeQueDeveFalhar(nome: string, texto: string, trechoEsperado: string) {
  try {
    validarTextoArtigo(caminho, texto);
    throw new Error(`[FALHOU] ${nome}: a validação aceitou conteúdo inválido.`);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (!mensagem.includes(trechoEsperado)) {
      throw new Error(`[FALHOU] ${nome}: mensagem inesperada: ${mensagem}`);
    }
    console.log(`[OK] ${nome}: rejeitou e indicou ${trechoEsperado}`);
  }
}

try {
  carregarArtigos();
  console.log("[OK] Artigos válidos carregam normalmente.");

  testeQueDeveFalhar(
    "Resumo muito longo",
    textoValido.replace(
      /resumo: "[^"]+"/,
      `resumo: "${"X".repeat(170)}"`,
    ),
    "frontmatter.resumo",
  );

  testeQueDeveFalhar(
    "Categoria inexistente",
    textoValido.replace('categoria: "cadastros"', 'categoria: "categoria-inexistente"'),
    "frontmatter.categoria",
  );

  testeQueDeveFalhar(
    "Seção fora de ordem",
    textoValido.replace("## Problema", "## Título incorreto"),
    "corpo.seção 1",
  );

  testeQueDeveFalhar(
    "Revisão fiscal obrigatória",
    textoValido.replace('categoria: "cadastros"', 'categoria: "notas-fiscais"'),
    "frontmatter.revisarAte",
  );

  console.log("✅ Testes de validação concluídos, sem modificar nenhum artigo.");
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exitCode = 1;
}
