"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { inserirReferenciaImagem, MIMES_IMAGEM, TAMANHO_MAXIMO_IMAGEM, URL_IMAGEM_PRIVADA } from "../lib/imagens";
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
  const seletorImagem = useRef<HTMLInputElement>(null);
  const posicaoUpload = useRef<{ inicio: number; fim: number } | null>(null);
  const areaEditor = useRef<HTMLFieldSetElement>(null);
  const [descricao, setDescricao] = useState("");
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const restauracaoConcluida = useRef(false);
  const chaveRascunho = `nortesys-kb-rascunho-${chave}`;
  useEffect(() => {
    const form = areaEditor.current?.form;
    if (!enviandoImagem || !form) return;
    const impedir = (evento: Event) => { evento.preventDefault(); setAviso("Aguarde o envio da imagem antes de salvar."); };
    form.addEventListener("submit", impedir);
    return () => form.removeEventListener("submit", impedir);
  }, [enviandoImagem]);
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
    else if(caminho) setAviso("Use /imagens/nome.webp para imagens existentes ou o botão Enviar print para um novo arquivo.");
  }
  function selecionarImagem() {
    const inicio = campo.current?.selectionStart ?? conteudo.length;
    posicaoUpload.current = { inicio, fim: campo.current?.selectionEnd ?? inicio };
    seletorImagem.current?.click();
  }
  async function enviarImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.currentTarget.files?.[0];
    evento.currentTarget.value = "";
    if (!arquivo) return;
    if (arquivo.size === 0 || arquivo.size > TAMANHO_MAXIMO_IMAGEM ||
        !MIMES_IMAGEM.some(mime => mime === arquivo.type)) {
      setAviso("Escolha PNG, JPG ou WebP com até 2 MB.");
      return;
    }
    const posicao = posicaoUpload.current ?? { inicio: conteudo.length, fim: conteudo.length };
    // Confere o limite antes de fazer um upload que não poderia ser inserido.
    try { inserirReferenciaImagem(conteudo, posicao.inicio, posicao.fim, "/api/imagens/00000000-0000-4000-8000-000000000000", descricao || arquivo.name); }
    catch (falha) { setAviso(falha instanceof Error ? falha.message : "Conteúdo muito longo."); return; }
    setEnviandoImagem(true);
    setAviso("Validando e enviando a imagem...");
    try {
      const dados = new FormData();
      dados.set("imagem", arquivo);
      dados.set("alt", descricao || arquivo.name);
      const resposta = await fetch("/api/admin/imagens", {
        method: "POST", body: dados, credentials: "same-origin", cache: "no-store",
      });
      const retorno: { url?: string; alt?: string; erro?: string } = await resposta.json();
      if (!resposta.ok || !retorno.url || !URL_IMAGEM_PRIVADA.test(retorno.url)) {
        throw new Error(retorno.erro || "Não foi possível enviar a imagem.");
      }
      const novo = inserirReferenciaImagem(conteudo, posicao.inicio, posicao.fim, retorno.url, retorno.alt || descricao || arquivo.name);
      setConteudo(novo.conteudo);
      setDescricao("");
      setAba("editar");
      requestAnimationFrame(() => { campo.current?.focus(); campo.current?.setSelectionRange(novo.cursor, novo.cursor); });
      setAviso("Imagem inserida. Use Pré-visualizar e depois salve o artigo para guardar a referência.");
    } catch (falha) {
      setAviso(falha instanceof Error ? falha.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
      posicaoUpload.current = null;
    }
  }
  return <fieldset ref={areaEditor} disabled={enviandoImagem} className="grid min-w-0 gap-3" aria-busy={enviandoImagem}>
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
      <button type="button" className="botao-secundario" onClick={imagem}>Inserir imagem existente</button>
      <>
        <button type="button" className="botao-secundario" onClick={selecionarImagem} disabled={enviandoImagem}>
          {enviandoImagem ? "Enviando imagem..." : "Enviar print"}
        </button>
        <input ref={seletorImagem} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
          aria-label="Selecionar print para enviar" onChange={enviarImagem} tabIndex={-1}/>
      </>
    </div>
    <label className="grid gap-1 text-sm">Descrição alternativa do próximo print
      <input className={CAMPO} value={descricao} maxLength={90} onChange={e=>setDescricao(e.target.value)} placeholder="Descreva o que a captura mostra"/>
    </label>
    {enviandoImagem && <progress className="w-full" aria-label="Envio da imagem em andamento"/>}
    {aba==="editar" ? <textarea ref={campo} className={`${CAMPO} font-mono text-[13px] leading-6`} name="conteudo" rows={24} minLength={15} maxLength={60000} value={conteudo} onChange={e=>setConteudo(e.target.value)} required aria-label="Conteúdo do artigo"/> : <><input type="hidden" name="conteudo" value={conteudo}/><div className="cartao min-h-56 p-5" aria-label="Prévia do artigo"><ConteudoMarkdown markdown={conteudo}/></div></>}
    <p className="text-[13px] text-[var(--muted)]" role="status">{aviso || "Alterações de conteúdo são guardadas temporariamente nesta aba. Para publicar, clique em Salvar."} {conteudo.length.toLocaleString("pt-BR")}/60.000 caracteres.</p>
    <p className="text-[13px] text-[var(--muted)]">PNG/JPEG/WebP até 2 MB. A imagem fica privada; salve o artigo para associá-la ao conteúdo. Até lá, só você poderá visualizá-la.</p>
    {editando && <button type="button" className="botao-secundario w-fit" onClick={()=>{sessionStorage.removeItem(chaveRascunho);setTipo(tipoInicial);setConteudo(conteudoInicial);setAviso("Rascunho local descartado.");}}>Descartar rascunho desta aba</button>}
  </fieldset>;
}
