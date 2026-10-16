import { z } from "zod";
import { slugsCategorias } from "../../config/categorias";

/**
 * Alguns leitores de YAML convertem datas sem aspas em Date do JavaScript.
 * Aceitamos essas datas e as normalizamos para AAAA-MM-DD.
 * O campo continua sendo uma string no resto do projeto.
 */
const dataISO = z.preprocess(
  (valor) =>
    valor instanceof Date && !Number.isNaN(valor.getTime())
      ? valor.toISOString().slice(0, 10)
      : valor,
  z.iso.date(),
);

const textoObrigatorio = z.string().trim().min(1, "não pode ficar vazio");
const listaTextos = z.array(textoObrigatorio);

export const artigoFrontmatterSchema = z
  .object({
    titulo: textoObrigatorio,
    resumo: textoObrigatorio.max(160, "deve ter no máximo 160 caracteres"),
    categoria: z.enum(slugsCategorias, {
      error: `use uma categoria existente: ${slugsCategorias.join(", ")}`,
    }),
    sistema: textoObrigatorio,
    tags: listaTextos,
    codigosErro: listaTextos.optional(),
    nivel: z.enum(["N1", "N2", "N3"]),
    autor: textoObrigatorio,
    criadoEm: dataISO,
    atualizadoEm: dataISO,
    revisarAte: dataISO.optional(),
    fonteOficial: z.array(z.httpUrl()).optional(),
    status: z.enum(["rascunho", "revisado", "obsoleto"]),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (
      (dados.categoria === "notas-fiscais" ||
        dados.categoria === "fiscal-e-impostos") &&
      !dados.revisarAte
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["revisarAte"],
        message: "é obrigatório para Notas Fiscais e Fiscal e Impostos",
      });
    }

    if (dados.atualizadoEm < dados.criadoEm) {
      contexto.addIssue({
        code: "custom",
        path: ["atualizadoEm"],
        message: "não pode ser anterior a criadoEm",
      });
    }
  });
