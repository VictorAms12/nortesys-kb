"use client";

import { useMemo, useState } from "react";
import type { ResumoArtigo } from "../lib/apresentacao";
import { CartaoArtigo } from "./cartao-artigo";
import { TIPOS_CONTEUDO, TODOS_TIPOS } from "../lib/tipos-conteudo";

type Props = { artigos: ResumoArtigo[]; hoje: string };

export function FiltrosCategoria({ artigos, hoje }: Props) {
  const [tag, setTag] = useState("");
  const [sistema, setSistema] = useState("");
  const [nivel, setNivel] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const tags = useMemo(() => [...new Set(artigos.flatMap((a) => a.tags))].sort((a,b)=>a.localeCompare(b,"pt-BR")), [artigos]);
  const sistemas = useMemo(() => [...new Set(artigos.map((a) => a.sistema))].sort(), [artigos]);
  const filtrados = artigos.filter((a) =>
    (!tag || a.tags.includes(tag)) && (!sistema || a.sistema === sistema) &&
    (!nivel || a.nivel === nivel) && (!status || a.status === status) && (!tipo || a.tipo === tipo)
  ).sort((a,b)=>ordem==="az"?a.titulo.localeCompare(b.titulo,"pt-BR"):b.atualizadoEm.localeCompare(a.atualizadoEm));
  const filtrosAtivos = Boolean(tag || sistema || nivel || status || tipo);
  return (
    <section aria-label="Artigos e filtros">
      <div className="cartao mb-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="campo-filtro">Tag
          <select value={tag} onChange={(e)=>setTag(e.target.value)}><option value="">Todas as tags</option>{tags.map((t)=><option value={t} key={t}>{t}</option>)}</select>
        </label>
        <label className="campo-filtro">Sistema
          <select value={sistema} onChange={(e)=>setSistema(e.target.value)}><option value="">Todos os sistemas</option>{sistemas.map((s)=><option value={s} key={s}>{s}</option>)}</select>
        </label>
        <label className="campo-filtro">Nível
          <select value={nivel} onChange={(e)=>setNivel(e.target.value)}><option value="">Todos os níveis</option>{["N1","N2","N3"].map((n)=><option value={n} key={n}>{n}</option>)}</select>
        </label>
        <label className="campo-filtro">Status
          <select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">Todos os status</option>{["rascunho","revisado","obsoleto"].map((s)=><option value={s} key={s}>{s}</option>)}</select>
        </label>
        <label className="campo-filtro">Tipo de conteúdo
          <select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="">Todos os tipos</option>{TODOS_TIPOS.map(t=><option value={t} key={t}>{TIPOS_CONTEUDO[t].nome}</option>)}</select>
        </label>
        <label className="campo-filtro">Ordenar por
          <select value={ordem} onChange={e=>setOrdem(e.target.value)}><option value="recentes">Mais recentes</option><option value="az">Título A–Z</option></select>
        </label>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">{filtrados.length} de {artigos.length} artigo(s)</p>
        {filtrosAtivos && <button className="botao-secundario" type="button" onClick={()=>{setTag("");setSistema("");setNivel("");setStatus("");setTipo("");setOrdem("recentes");}}>Limpar filtros</button>}
      </div>
      {filtrados.length ? <div key={JSON.stringify([tag,sistema,nivel,status,tipo,ordem])} className="lista-animada grid gap-4 lg:grid-cols-2">{filtrados.map(a=><CartaoArtigo key={a.url} artigo={a} hoje={hoje}/>)}</div> :
        <div className="cartao p-8 text-center"><p className="text-lg font-semibold">Nenhum artigo com esses filtros.</p><p className="mt-2 text-sm text-[var(--muted)]">Tente remover um filtro ou escolha outra categoria.</p></div>}
    </section>
  );
}
