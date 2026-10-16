import matter from "gray-matter";
import { z } from "zod";
import { slugsCategorias } from "../../config/categorias";
import { validarTextoArtigo } from "./artigos";
import { modeloConteudo, TODOS_TIPOS } from "./tipos-conteudo";

export const slugValido = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const texto = (form: FormData, chave: string): string => {
  const entrada = form.get(chave);
  return typeof entrada === "string" ? entrada.trim() : "";
};
const dataHoje = () => new Date().toISOString().slice(0,10);
const lista = (v: string): string[] => v.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
const dadosForm = z.object({
  // Compatibilidade: formulários criados até a Fase 6 não enviam o campo `tipo`.
  // Um campo ausente chega como string vazia pelo helper `texto`.
  // Tipos explícitos incorretos continuam sendo rejeitados pelo enum.
  tipo: z.preprocess(
    valor => valor === "" || valor === undefined ? "solucao" : valor,
    z.enum(TODOS_TIPOS),
  ),
  slug: z.string().min(3).max(100).regex(slugValido),
  titulo: z.string().min(5).max(180),
  resumo: z.string().min(10).max(160),
  categoria: z.enum(slugsCategorias),
  sistema: z.string().min(2).max(80),
  nivel: z.enum(["N1","N2","N3"]),
  status: z.enum(["rascunho", "revisado", "obsoleto"]),
  revisarAte: z.string().max(10),
  tags: z.string().max(500),
  codigosErro: z.string().max(500),
  fonteOficial: z.string().max(1500),
  conteudo: z.string().min(15).max(60000),
});
export const MODELO_CORPO = modeloConteudo("solucao");

export function criarTextoDoFormulario(form: FormData, nomeAutor: string, dataCriacao?: string): {
  categoria: string; slug: string; titulo: string; status: "rascunho"|"revisado"|"obsoleto"; conteudo: string;
} {
  const bruto = Object.fromEntries([
    "tipo", "slug", "titulo", "resumo", "categoria", "sistema", "nivel", "status", "revisarAte", "tags", "codigosErro", "fonteOficial", "conteudo",
  ].map(chave => [chave, texto(form,chave)]));
  const validado = dadosForm.parse(bruto);
  const hoje = dataHoje();
  const frontmatter = {
    tipo: validado.tipo, titulo: validado.titulo, resumo: validado.resumo, categoria: validado.categoria,
    sistema: validado.sistema, tags: lista(validado.tags), codigosErro: lista(validado.codigosErro),
    nivel: validado.nivel, autor: nomeAutor, criadoEm: dataCriacao ?? hoje,
    atualizadoEm: hoje, ...(validado.revisarAte ? { revisarAte: validado.revisarAte } : {}),
    fonteOficial: lista(validado.fonteOficial), status: validado.status,
  };
  const conteudo = matter.stringify(`\n${validado.conteudo}\n`,frontmatter);
  validarTextoArtigo(`content/${validado.categoria}/${validado.slug}.md`, conteudo);
  return { categoria: validado.categoria, slug: validado.slug, titulo: validado.titulo, status: validado.status, conteudo };
}
