import { criarTextoDoFormulario } from "../../src/lib/formulario-artigo";
import { validarTextoArtigo } from "../../src/lib/artigos";

/** Artigo sintético em memória; não é publicado em content/ nem no Neon. */
export const CAMINHO_ARTIGO_TESTE = "content/erp/impressora-homologacao.md";

export function textoArtigoDeTeste(): string {
  const formulario = new FormData();
  const dados: Record<string,string> = {
    tipo: "solucao",
    slug: "impressora-homologacao",
    titulo: "Configurar impressora no ambiente de teste",
    resumo: "Verificação de impressoras em um laboratório fictício de homologação.",
    categoria: "erp",
    sistema: "Nortesys (homologação)",
    nivel: "N1",
    status: "rascunho",
    revisarAte: "",
    tags: "impressora, impressão, spooler, fila",
    codigosErro: "IMP-001",
    fonteOficial: "",
    conteudo: [
      "## Problema",
      "A impressora não imprime o relatório de teste do ERP.",
      "## Sintomas e mensagem exata",
      "Erro IMP-001: impressora não encontrada.",
      "## Causa provável",
      "Fila de impressão travada ou driver de teste desatualizado.",
      "## Solução passo a passo",
      "1. Conferir a impressora conectada ao ambiente de teste.",
      "2. Limpar a fila e reiniciar o spooler de impressão.",
      "3. Verificar a permissão do operador para imprimir relatórios.",
      "## Como confirmar que resolveu",
      "Imprimir um documento de teste e verificar se o trabalho saiu da fila.",
      "## Se não resolver: quando e para quem escalar",
      "Encaminhe ao N2 com o código do erro e evidências fictícias.",
      "## Artigos relacionados",
      "Nenhum link relacionado neste teste de validação."
    ].join("\n\n")
  };
  for (const [chave, valor] of Object.entries(dados)) formulario.set(chave,valor);
  return criarTextoDoFormulario(formulario,"Equipe de Testes","2026-10-16").conteudo;
}

export function artigoDeTeste() {
  return validarTextoArtigo(CAMINHO_ARTIGO_TESTE,textoArtigoDeTeste());
}
