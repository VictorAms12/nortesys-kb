/** Compatível com artigos antigos: sem `tipo`, o modelo padrão é solução de problema. */
export const TIPOS_CONTEUDO = {
  solucao: { nome: "Solução de problema", secoes: [
    "Problema", "Sintomas e mensagem exata", "Causa provável", "Solução passo a passo",
    "Como confirmar que resolveu", "Se não resolver: quando e para quem escalar", "Artigos relacionados",
  ] },
  tutorial: { nome: "Tutorial / passo a passo", secoes: [
    "Objetivo", "Pré-requisitos", "Passo a passo", "Resultado esperado", "Artigos relacionados",
  ] },
  guia: { nome: "Guia técnico", secoes: [
    "Introdução", "Conceitos importantes", "Orientações e exemplos", "Referências e materiais relacionados",
  ] },
  faq: { nome: "Pergunta frequente (FAQ)", secoes: ["Pergunta", "Resposta"] },
} as const;
export type TipoConteudo = keyof typeof TIPOS_CONTEUDO;
export const TODOS_TIPOS = ["solucao", "tutorial", "guia", "faq"] as const satisfies readonly TipoConteudo[];
export function tipoConteudoValido(valor: unknown): valor is TipoConteudo {
  return typeof valor === "string" && valor in TIPOS_CONTEUDO;
}
export function modeloConteudo(tipo: TipoConteudo): string {
  return TIPOS_CONTEUDO[tipo].secoes.map((titulo) => `## ${titulo}\n\nPreencha esta seção com conteúdo claro e validado.`).join("\n\n");
}
