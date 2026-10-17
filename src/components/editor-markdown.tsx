"use client";

import { useEffect, useRef, useState } from "react";
import { ConteudoMarkdown } from "./conteudo-markdown";
import { TIPOS_CONTEUDO, TODOS_TIPOS, modeloConteudo, type TipoConteudo } from "../lib/tipos-conteudo";

type Props = { conteudoInicial: string; tipoInicial: TipoConteudo; chave: string; editando: boolean };
const CAMPO = "block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]";
export function EditorMarkdown({ conteudoInicial, tipoInicial, chave, editando }: Props) {
  const [tipo, setTipo] = useState<TipoConteudo>(tipoInicial);
  const [conteudo, setConteudo] = useState(conteudoInicial);
  const [aba, setAba] = useState<"editar"|"visualizar">("editar");
  const [aviso, setAviso] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const restauracaoConcluida = useRef(false);
  const chaveRascunho = `nortesys-kb-rascunho-${chave}`;
  useEffect(() => {
    // A leitura do sessionStorage é uma sincronização externa: a atualização
    // de estado ocorre no callback assíncrono, não no corpo do efeito.
    restauracaoConcluida.current = false;
    const tarefa = window.setTimeout(() => {
      try {
        const salvo = sessionStorage.getItem(chaveRascunho);
        if (salvo) {
          const dado: unknown = JSON.parse(salvo);
          if (dado && typeof dado === "object" && "conteudo" in dado && typeof dado.conteudo === "string" && dado.conteudo.length <= 60000) {
            setConteudo(dado.conteudo);
            if ("tipo" in dado && typeof dado.tipo === "string" && dado.tipo in TIPOS_CONTEUDO) setTipo(dado.tipo as TipoConteudo);
            setAviso("Rascunho desta aba restaurado; revise antes de salvar.");
          }
        }
      } catch { /* Armazenamento do navegador indisponível. */ }
      finally { restauracaoConcluida.current = true; }
    }, 0);
    return () => window.clearTimeout(tarefa);
  }, [chaveRascunho]);
  useEffect(() => {
    // Não sobrescrever um rascunho existente antes de restaurá-lo.
    if (!restauracaoConcluida.current) return;
    const atraso = setTimeout(() => {
      try { sessionStorage.setItem(chaveRascunho, JSON.stringify({ tipo, conteudo })); } catch { /* Navegador sem armazenamento. */ }
    }, 800);
    return () => clearTimeout(atraso);
  }, [tipo, conteudo, chaveRascunho]);
  function inserir(antes:string, depois="", placeholder="texto") {
    const el=campo.current;
    const inicio=el?.selectionStart ?? conteudo.length;
    const fim=el?.selectionEnd ?? inicio;
    const selecionado=conteudo.slice(inicio,fim)||placeholder;
    const novo=conteudo.slice(0,inicio)+antes+selecionado+depois+conteudo.slice(fim);
    setConteudo(novo.slice(0,60000));
    setAba("editar");
    requestAnimationFrame(()=>{el?.focus();el?.setSelectionRange(inicio+antes.length, inicio+antes.length+selecionado.length);});
  }
  function trocarModelo(novo:TipoConteudo){
    if(novo!==tipo && conteudo.trim()!==modeloConteudo(tipo).trim() && !window.confirm("Trocar o modelo altera os títulos das seções. Substituir o conteúdo atual?")) return;
    setTipo(novo);setConteudo(modeloConteudo(novo));setAviso("Confira as seções obrigatórias antes de publicar.");
  }
  function imagem(){
    const caminho=window.prompt("Informe o caminho da imagem no projeto (ex.: /imagens/tela.webp).");
    if (caminho && /^\/imagens\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp|gif)$/.test(caminho)) inserir(`![Descrição da imagem](${caminho})`,"","");
    else if(caminho) setAviso("Use somente imagens locais em /public/imagens. Upload pelo navegador não está habilitado.");
  }
  return <div className="grid gap-3">
    <label className="grid gap-1 text-sm font-semibold">Tipo de conteúdo
      <select className={CAMPO} name="tipo" value={tipo} onChange={e=>trocarModelo(e.target.value as TipoConteudo)}>
        {TODOS_TIPOS.map(t=><option key={t} value={t}>{TIPOS_CONTEUDO[t].nome}</option>)}
      </select>
    </label>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-semibold">Conteúdo em Markdown — {TIPOS_CONTEUDO[tipo].secoes.length} seções</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Modo do editor">
        <button type="button" className="botao-secundario" aria-pressed={aba==="editar"} onClick={()=>setAba("editar")}>Editar</button>
        <button type="button" className="botao-secundario" aria-pressed={aba==="visualizar"} onClick={()=>setAba("visualizar")}>Pré-visualizar</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Formatação do Markdown">
      <button type="button" className="botao-secundario" onClick={()=>inserir("**","**")}>Negrito</button>
      <button type="button" className="botao-secundario" onClick={()=>inserir("- ","","item")}>Lista</button>
      <button type="button" className="botao-secundario" onClick={()=>inserir("1. ","","passo")}>Passo</button>
      <button type="button" className="botao-secundario" onClick={()=>inserir("`","`","código")}>Código</button>
      <button type="button" className="botao-secundario" onClick={()=>inserir("\n```text\n","\n```\n","exemplo")}>Bloco de código</button>
      <button type="button" className="botao-secundario" onClick={()=>inserir("| Coluna 1 | Coluna 2 |\n|---|---|\n| Valor | "," |","Valor")}>Tabela</button>
      <button type="button" className="botao-secundario" onClick={imagem}>Imagem local</button>
    </div>
    {aba==="editar" ? <textarea ref={campo} className={`${CAMPO} font-mono text-xs leading-6`} name="conteudo" rows={24} minLength={15} maxLength={60000} value={conteudo} onChange={e=>setConteudo(e.target.value)} required aria-label="Conteúdo do artigo"/> : <><input type="hidden" name="conteudo" value={conteudo}/><div className="cartao min-h-56 p-5" aria-label="Prévia do artigo"><ConteudoMarkdown markdown={conteudo}/></div></>}
    <p className="text-xs text-[var(--muted)]" role="status">{aviso || "Alterações de conteúdo são guardadas temporariamente nesta aba. Para publicar, clique em Salvar."} {conteudo.length.toLocaleString("pt-BR")}/60.000 caracteres.</p>
    {editando && <button type="button" className="botao-secundario w-fit" onClick={()=>{sessionStorage.removeItem(chaveRascunho);setTipo(tipoInicial);setConteudo(conteudoInicial);setAviso("Rascunho local descartado.");}}>Descartar rascunho desta aba</button>}
  </div>;
}
