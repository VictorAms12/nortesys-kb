"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
type Resumo = {id:string;titulo:string;categoria:string;slug:string;status:string;arquivado:boolean;versao:number;tipo:string};
const normalizar=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
export function PesquisaAdminArtigos({artigos}:{artigos:Resumo[]}) {
  const [consulta,setConsulta]=useState("");const [status,setStatus]=useState("todos");const [limite,setLimite]=useState(25);
  const filtrados=useMemo(()=>artigos.filter(a=>{
    const campo=normalizar([a.titulo,a.categoria,a.slug,a.tipo].join(" "));
    const corresponde=campo.includes(normalizar(consulta.trim()));
    const estado=status==="todos"||status==="arquivado"&&a.arquivado||status===a.status&&!a.arquivado;
    return corresponde&&estado;
  }),[artigos,consulta,status]);
  return <div className="grid gap-4">
    <div className="cartao grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
      <label className="campo-filtro">Pesquisar artigos
        <input type="search" placeholder="Título, slug, categoria..." value={consulta} onChange={e=>{setConsulta(e.target.value);setLimite(25);}}/>
      </label>
      <label className="campo-filtro">Status
        <select value={status} onChange={e=>{setStatus(e.target.value);setLimite(25);}}>
          <option value="todos">Todos os artigos</option><option value="rascunho">Rascunhos</option>
          <option value="revisado">Revisados</option><option value="obsoleto">Obsoletos</option>
          <option value="arquivado">Arquivados</option>
        </select>
      </label>
    </div>
    <p className="text-sm text-[var(--muted)]" role="status">{filtrados.length} de {artigos.length} artigo(s)</p>
    {filtrados.length===0?<p className="cartao p-7">Nenhum artigo encontrado com os filtros selecionados.</p>:
    <div className="grid gap-3">{filtrados.slice(0,limite).map(a=>
      <article className="cartao flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center" key={a.id}>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">
          <span className="etiqueta">{a.arquivado?"Arquivado":a.status}</span><span className="etiqueta">{a.tipo}</span>
          <span className="text-xs text-[var(--muted)]">Versão {a.versao}</span>
        </div><h3 className="mt-2 text-base font-bold">{a.titulo}</h3>
          <p className="mt-1 break-all text-xs text-[var(--muted)]">{a.categoria}/{a.slug}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link className="botao-secundario" href={`/admin/artigos/novo?modelo=${a.id}`}>Duplicar</Link>
          <Link className="botao-secundario" href={`/admin/artigos/${a.id}`}>{a.arquivado?"Ver histórico":"Editar"}</Link>
        </div>
      </article>)}</div>}
    {filtrados.length>limite&&<button className="botao-secundario justify-self-center" type="button" onClick={()=>setLimite(v=>v+25)}>Carregar mais artigos</button>}
  </div>;
}
