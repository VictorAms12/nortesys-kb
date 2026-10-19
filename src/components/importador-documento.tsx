"use client";
import {useState,type ChangeEvent} from "react";
import Link from "next/link";
import {categorias} from "../../config/categorias";
import {TODOS_TIPOS,TIPOS_CONTEUDO,type TipoConteudo} from "../lib/tipos-conteudo";
import {normalizarTextoImportado,gerarMarkdownImportado,resumoImportado} from "../lib/importacao-rascunho";
import {EditorMarkdown} from "./editor-markdown";
import {TituloSlugArtigo} from "./titulo-slug-artigo";
import {FormularioComFeedback} from "./formulario-com-feedback";

const campo="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]";
export function ImportadorDocumento() {
  const [texto,setTexto]=useState("");
  const [nomeFonte,setNomeFonte]=useState("");
  const [tipo,setTipo]=useState<TipoConteudo>("tutorial");
  const [gerado,setGerado]=useState("");
  const [titulo,setTitulo]=useState("");
  const [resumo,setResumo]=useState("");
  const [contador,setContador]=useState(0);
  const [aviso,setAviso]=useState("");
  async function arquivoSelecionado(e:ChangeEvent<HTMLInputElement>){
    const arquivo=e.currentTarget.files?.[0];e.currentTarget.value="";if(!arquivo)return;
    if(!/\.(txt|md)$/i.test(arquivo.name)){setAviso("Somente arquivos TXT ou MD podem ser lidos automaticamente. Para PDFs, copie o texto da visualização.");return;}
    if(arquivo.size>150*1024){setAviso("Arquivo maior que 150 KB. Selecione um trecho menor.");return;}
    try {
      const conteudo=await arquivo.text();
      normalizarTextoImportado(conteudo);
      setTexto(conteudo);setNomeFonte(arquivo.name);setTitulo(arquivo.name.replace(/\.(txt|md)$/i,"").replace(/[-_]+/g," ").slice(0,180));
      setAviso("Arquivo lido somente nesta aba. Revise o conteúdo antes de preparar o artigo.");
    } catch(e){setAviso(e instanceof Error?e.message:"Não foi possível ler o arquivo.");}
  }
  function preparar(){
    try {
      const corpo=gerarMarkdownImportado(texto,tipo);
      setGerado(corpo);
      setResumo(resumoImportado(texto));
      setTitulo(atual=>atual.trim().length>=5?atual:(nomeFonte||"Documento importado"));
      setContador(n=>n+1);setAviso(""); 
    }catch(e){setAviso(e instanceof Error?e.message:"Documento inválido.");}
  }
  if(!gerado)return <section className="cartao grid gap-4 p-5 sm:p-7">
    <div><h2 className="text-lg font-bold">1. Preparar o documento</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Carregue TXT/Markdown ou copie e cole o texto de um PDF aberto na área de anexos. Nenhum documento é publicado automaticamente.</p></div>
    <label className="grid gap-1 text-sm font-semibold">Arquivo de texto (opcional)
      <input className={campo} type="file" accept=".txt,.md,text/plain,text/markdown" onChange={e=>void arquivoSelecionado(e)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Texto de origem
      <textarea className={campo} rows={14} value={texto} maxLength={26000} onChange={e=>setTexto(e.target.value)}
        placeholder="Cole aqui o texto extraído de um manual PDF, procedimento TXT ou Markdown."/>
      <span className="text-xs font-normal text-[var(--muted)]">Limite: 25.000 caracteres. Revise previamente e remova dados sensíveis.</span>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Modelo de artigo
      <select className={campo} value={tipo} onChange={e=>setTipo(e.target.value as TipoConteudo)}>
        {TODOS_TIPOS.map(t=><option key={t} value={t}>{TIPOS_CONTEUDO[t].nome}</option>)}
      </select>
    </label>
    {aviso&&<p role="status" className="text-sm text-[var(--muted)]">{aviso}</p>}
    <button className="botao-primario justify-self-start" type="button" onClick={preparar}>Preparar rascunho →</button>
  </section>;

  return <section className="grid gap-5">
    <div className="cartao p-5"><div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-bold">2. Revisar e criar o artigo</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">O texto original foi colocado em uma seção do modelo. Complete as demais seções e corrija informações antes de salvar como rascunho.</p></div>
      <button type="button" className="botao-secundario" onClick={()=>setGerado("")}>Voltar ao documento</button>
    </div></div>
    <FormularioComFeedback className="cartao grid gap-4 p-5 sm:p-7" action="/api/admin/artigos" method="post" mensagemEnvio="Criando artigo em rascunho...">
      <input type="hidden" name="acao" value="criar"/><input type="hidden" name="status" value="rascunho"/>
      <div className="grid gap-4 sm:grid-cols-2" key={contador}>
        <TituloSlugArtigo tituloInicial={titulo} slugInicial="" className={campo}/>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Resumo
          <textarea className={campo} name="resumo" rows={3} defaultValue={resumo} minLength={10} maxLength={160} required/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Categoria
          <select className={campo} name="categoria" defaultValue="erp">{categorias.map(c=><option key={c.slug} value={c.slug}>{c.nome}</option>)}</select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Sistema
          <input className={campo} name="sistema" defaultValue="Nortesys" minLength={2} maxLength={80} required/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Nível
          <select className={campo} name="nivel" defaultValue="N1"><option>N1</option><option>N2</option><option>N3</option></select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Revisar até (obrigatório para assuntos fiscais)
          <input className={campo} name="revisarAte" type="date"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Tags
          <input className={campo} name="tags" maxLength={500} placeholder="Separadas por vírgula"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Códigos de erro
          <input className={campo} name="codigosErro" maxLength={500}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Fontes oficiais (URLs)
          <textarea className={campo} name="fonteOficial" maxLength={1500} rows={2}/>
        </label>
      </div>
      <EditorMarkdown key={contador} conteudoInicial={gerado} tipoInicial={tipo} chave={"importacao-"+contador} editando={false}/>
      <p className="text-xs leading-6 text-[var(--muted)]">O documento original não é armazenado aqui nem anexado automaticamente. Se precisar guardar o PDF, anexe-o ao artigo depois de criá-lo. Verifique a legitimidade das informações antes de publicar.</p>
      <div className="flex flex-wrap gap-3"><button type="submit" className="botao-primario">Criar rascunho</button>
        <Link className="botao-secundario" href="/admin/artigos">Cancelar</Link></div>
    </FormularioComFeedback>
  </section>;
}
