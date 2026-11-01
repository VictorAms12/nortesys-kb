import { carregarArtigos, validarTextoArtigo } from "../src/lib/artigos";
import { CAMINHO_ARTIGO_TESTE, textoArtigoDeTeste } from "./fixtures/artigo-teste";

const caminho = CAMINHO_ARTIGO_TESTE;
const textoValido = textoArtigoDeTeste();

function testeQueDeveFalhar(nome: string, texto: string, trechoEsperado: string) {
  try {
    validarTextoArtigo(caminho, texto);
    throw new Error("[FALHOU] " + nome + ": a validação aceitou conteúdo inválido.");
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (!mensagem.includes(trechoEsperado)) {
      throw new Error("[FALHOU] " + nome + ": mensagem inesperada: " + mensagem);
    }
    console.log("[OK] " + nome + ": rejeitou e indicou " + trechoEsperado);
  }
}

try {
  carregarArtigos(); // A pasta content/ pode não conter nenhum artigo Markdown.
  validarTextoArtigo(caminho, textoValido);
  console.log("[OK] Fixture sintética válida; carregamento funciona com catálogo vazio.");

  testeQueDeveFalhar(
    "Resumo muito longo",
    textoValido.replace(/^resumo:.*$/m, 'resumo: "' + "X".repeat(170) + '"'),
    "frontmatter.resumo",
  );

  testeQueDeveFalhar(
    "Categoria inexistente",
    textoValido.replace(/^categoria:.*$/m, "categoria: categoria-inexistente"),
    "frontmatter.categoria",
  );

  testeQueDeveFalhar(
    "Seção fora de ordem",
    textoValido.replace("## Problema", "## Título incorreto"),
    "corpo.seção 1",
  );

  testeQueDeveFalhar(
    "Revisão fiscal obrigatória",
    textoValido.replace(/^categoria:.*$/m, "categoria: notas-fiscais"),
    "frontmatter.revisarAte",
  );

  console.log("✅ Testes de validação concluídos, sem publicar artigo fictício.");
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exitCode = 1;
}
