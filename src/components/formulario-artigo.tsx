import Link from "next/link";
import matter from "gray-matter";
import { categorias } from "../../config/categorias";
import { MODELO_CORPO } from "../lib/formulario-artigo";
import { EditorMarkdown } from "./editor-markdown";
import { TituloSlugArtigo } from "./titulo-slug-artigo";
import { FormularioComFeedback } from "./formulario-com-feedback";
import { tipoConteudoValido } from "../lib/tipos-conteudo";
import type { RegistroArtigo } from "../lib/artigos-banco";

const campo="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]";
function texto(data: Record<string, unknown>, chave:string):string {return String(data[chave]??"");}
function dataISO(data:unknown):string {return data instanceof Date ? data.toISOString().slice(0,10) : typeof data === "string" ? data : "";}
function juntar(data:unknown):string {return Array.isArray(data)?data.join(", "):"";}
export function FormularioArtigo({registro,modelo,restaurarVersao}:{registro?:RegistroArtigo;modelo?:RegistroArtigo;restaurarVersao?:number}) {
  const origem = registro ?? modelo;
  const parsed=origem?matter(origem.conteudo):null;
  const front=(parsed?.data??{}) as Record<string,unknown>;
  // Imagens privadas não podem ser vinculadas a um artigo diferente; não as duplicar.
  const markdownOriginal=parsed?.content.trim()||MODELO_CORPO;
  const markdown=!registro && modelo
    ? markdownOriginal.replace(/\/api\/imagens\/[0-9a-f-]{36}/gi, "imagem-privada-nao-duplicada")
    : markdownOriginal;
  const tituloInicial=registro ? texto(front,"titulo") : modelo ? ("Cópia de " + texto(front,"titulo")).slice(0,180) : "";
  return (
    <FormularioComFeedback action="/api/admin/artigos" method="post" mensagemEnvio={registro ? "Salvando nova versão..." : "Criando artigo..."} className="cartao grid gap-4 p-5 sm:p-7">
      <div className="border-b border-[var(--border)] pb-4"><p className="sobre-titulo">Editor técnico</p><h3 className="mt-2 text-lg font-bold">Informações do procedimento</h3><p className="mt-2 text-sm text-[var(--muted)]">Organize o artigo para facilitar a consulta pela equipe.</p></div><input type="hidden" name="acao" value={registro?"salvar":"criar"}/>
      {registro && <><input type="hidden" name="id" value={registro.id}/><input type="hidden" name="versao" value={registro.versao}/></>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TituloSlugArtigo tituloInicial={tituloInicial} slugInicial={registro?.slug ?? ""} className={campo}/>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Resumo (máximo 160 caracteres)<textarea className={campo} name="resumo" rows={2} maxLength={160} defaultValue={texto(front,"resumo")} required/></label>
        <label className="grid gap-1 text-sm font-semibold">Categoria<select className={campo} name="categoria" defaultValue={origem?.categoria||categorias[0].slug}>{categorias.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Sistema<input className={campo} name="sistema" maxLength={80} defaultValue={texto(front,"sistema")||"Nortesys"} required/></label>
        <label className="grid gap-1 text-sm font-semibold">Nível<select className={campo} name="nivel" defaultValue={texto(front,"nivel")||"N1"}>{["N1","N2","N3"].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Status<select className={campo} name="status" defaultValue={registro?.status||"rascunho"}><option value="rascunho">Rascunho — apenas equipe editorial</option><option value="revisado">Revisado — publicado para leitores</option><option value="obsoleto">Obsoleto — exibe alerta</option></select></label>
        <label className="grid gap-1 text-sm font-semibold">Revisar até (obrigatório para artigos fiscais)<input className={campo} type="date" name="revisarAte" defaultValue={dataISO(front.revisarAte)}/></label>
        <label className="grid gap-1 text-sm font-semibold">Tags separadas por vírgula<input className={campo} name="tags" maxLength={500} defaultValue={juntar(front.tags)}/></label>
        <label className="grid gap-1 text-sm font-semibold">Códigos de erro<input className={campo} name="codigosErro" maxLength={500} defaultValue={juntar(front.codigosErro)}/></label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Fontes oficiais (URLs separadas por vírgula)<textarea className={campo} name="fonteOficial" rows={2} defaultValue={juntar(front.fonteOficial)}/></label>
      </div>
      <div className="border-t border-[var(--border)] pt-5"><p className="sobre-titulo">Conteúdo e validação</p><h3 className="mt-2 text-lg font-bold">Editor avançado</h3></div>
      <EditorMarkdown conteudoInicial={markdown} tipoInicial={tipoConteudoValido(front.tipo)?front.tipo:"solucao"} chave={registro?`${registro.id}-v${registro.versao}${restaurarVersao?`-recuperar-${restaurarVersao}`:""}`:modelo?`copia-${modelo.id}`:"novo"} editando={Boolean(registro)}/>
      <p className="text-[13px] leading-6 text-[var(--muted)]">Respeite os títulos do modelo selecionado. Não inclua dados reais de clientes, senhas, tokens ou documentos fiscais. Depois de publicar, confira o artigo.</p>
      <div className="flex flex-wrap gap-3"><button className="botao-primario" type="submit">{registro?"Salvar nova versão":"Criar artigo"}</button><Link className="botao-secundario" href="/admin/artigos">Cancelar</Link></div>
    </FormularioComFeedback>
  );
}
