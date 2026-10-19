"use client";
import { useState, type ChangeEvent } from "react";
import type { AnexoArtigo } from "../lib/anexos-tipos";

export function AnexosArtigo({artigoId,iniciais}:{artigoId:string;iniciais:AnexoArtigo[]}) {
  const [anexos,setAnexos]=useState(iniciais);const [enviando,setEnviando]=useState(false);
  const [aviso,setAviso]=useState("");
  async function remover(id:string,nome:string) {
    if(!window.confirm(`Remover o documento “${nome}” deste artigo? Esta ação não apaga o histórico.`))return;
    setAviso("Removendo anexo...");
    try {
      const resposta=await fetch(`/api/admin/anexos/${id}`,{method:"DELETE",credentials:"same-origin",cache:"no-store"});
      const dados:{erro?:string}=await resposta.json();
      if(!resposta.ok)throw new Error(dados.erro||"Não foi possível remover.");
      setAnexos(lista=>lista.filter(a=>a.id!==id));setAviso("Anexo removido da visualização do artigo.");
    }catch(e){setAviso(e instanceof Error?e.message:"Falha ao remover.");}
  }
  async function enviar(evento:ChangeEvent<HTMLInputElement>) {
    const arquivo=evento.currentTarget.files?.[0];evento.currentTarget.value="";if(!arquivo)return;
    if(arquivo.size===0||arquivo.size>3*1024*1024||!arquivo.name.toLowerCase().endsWith(".pdf")) {
      setAviso("Escolha um PDF de até 3 MB.");return;
    }
    setEnviando(true);setAviso("Enviando o documento...");
    try {
      const form=new FormData();form.set("arquivo",arquivo);form.set("artigoId",artigoId);
      const resposta=await fetch("/api/admin/anexos",{method:"POST",body:form,credentials:"same-origin",cache:"no-store"});
      const dados: {anexo?:AnexoArtigo;erro?:string}=await resposta.json();
      if(!resposta.ok||!dados.anexo)throw new Error(dados.erro||"Não foi possível anexar o documento.");
      setAnexos(atuais=>[dados.anexo!,...atuais]);setAviso("Documento anexado ao artigo com sucesso.");
    }catch(e){setAviso(e instanceof Error?e.message:"Falha no envio.");}finally{setEnviando(false);}
  }
  return <section className="cartao mt-5 grid gap-3 p-5" aria-labelledby="titulo-anexos">
    <div><h3 id="titulo-anexos" className="text-lg font-bold">Documentos anexos</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">PDF de até 3 MB, armazenado de forma privada no Vercel Blob. Só ficará disponível aos leitores quando o artigo estiver publicado. Os anexos não são copiados ao duplicar artigos.</p></div>
    <label className="botao-secundario inline-flex w-fit cursor-pointer items-center gap-2">
      {enviando?"Enviando PDF...":"Adicionar PDF"}
      <input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={enviando} onChange={enviar}/>
    </label>
    {aviso&&<p className="text-sm" role="status" aria-live="polite">{aviso}</p>}
    {anexos.length===0?<p className="text-sm text-[var(--muted)]">Nenhum anexo neste artigo.</p>:
      <ul className="grid gap-2">{anexos.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3">
        <div className="min-w-0"><span className="break-all text-sm font-semibold">{a.nome}</span>
          <span className="ml-2 text-xs text-[var(--muted)]">{(a.tamanho/1024/1024).toFixed(2)} MB</span></div>
        <div className="flex flex-wrap gap-2">
          <a className="botao-secundario" href={`/api/anexos/${a.id}?visualizar=1`} target="_blank" rel="noopener noreferrer" aria-label={`Visualizar ${a.nome} em nova aba`}>Visualizar</a>
          <a className="botao-secundario" href={`/api/anexos/${a.id}`}>Baixar PDF</a>
          <button className="botao-secundario" type="button" disabled={enviando} onClick={()=>void remover(a.id,a.nome)}>Remover</button>
        </div>
      </li>)}</ul>}
  </section>;
}
