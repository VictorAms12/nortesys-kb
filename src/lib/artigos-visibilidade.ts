import type { Artigo } from "../types/artigo";
import type { Papel } from "./usuarios";
import { validarTextoArtigo } from "./artigos";

type Registro = { categoria: string; slug: string; status: Artigo["status"]; arquivado: boolean; conteudo: string };

/** O registro do banco prevalece, inclusive quando oculta uma cópia versionada. */
export function combinarArtigos(locais: Artigo[], registros: Registro[], papel: Papel): Artigo[] {
  const encontrados = new Map(locais
    .filter(a => papel !== "leitor" || a.status !== "rascunho")
    .map(a => [`${a.categoria}/${a.slug}`, a]));
  for (const registro of registros) {
    const chave = `${registro.categoria}/${registro.slug}`;
    encontrados.delete(chave);
    if (registro.arquivado || (registro.status === "rascunho" && papel === "leitor")) continue;
    const artigo = validarTextoArtigo(`content/${chave}.md`, registro.conteudo);
    if (papel === "leitor" && artigo.status === "rascunho") continue;
    encontrados.set(chave, artigo);
  }
  return [...encontrados.values()].sort((a, b) =>
    b.atualizadoEm.localeCompare(a.atualizadoEm) || a.titulo.localeCompare(b.titulo, "pt-BR"));
}
