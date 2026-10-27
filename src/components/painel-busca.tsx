"use client";

import { memo, useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { categorias } from "../../config/categorias";
import { criarBuscador, executarBusca, MINIMO_CARACTERES_BUSCA, trechoEncontrado, type ResultadoBusca } from "../lib/busca";
import { formatarData } from "../lib/apresentacao";
import type { DocumentoBusca } from "../lib/indice-busca";
import { EtiquetaStatus } from "./etiqueta-status";
import { TIPOS_CONTEUDO, TODOS_TIPOS } from "../lib/tipos-conteudo";

function Destaque({ texto, consulta }: { texto: string; consulta: string }) {
  // Divide o texto em segmentos React: nunca usa dangerouslySetInnerHTML.
  const termos = consulta.trim().split(/\s+/).filter((termo) => termo.length >= 2).slice(0, 8);
  if (!termos.length) return <>{texto}</>;
  const escape = (valor: string) => valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${termos.map(escape).join("|")})`, "gi");
  const partes = texto.split(regex);
  const termosMinusculos = new Set(termos.map((termo) => termo.toLocaleLowerCase("pt-BR")));
  return <>{partes.map((parte, i) => termosMinusculos.has(parte.toLocaleLowerCase("pt-BR")) ? <mark key={i} className="marca-busca">{parte}</mark> : <span key={i}>{parte}</span>)}</>;
}

type Props = { documentos: DocumentoBusca[] };

export function PainelBusca({ documentos }: Props) {
  const router = useRouter();
  const parametros = useSearchParams();
  const urlConsulta = (parametros.get("q") ?? "").slice(0, 120);
  const [edicao, setEdicao] = useState<{ origem: string; valor: string } | null>(null);
  const consulta = edicao?.origem === urlConsulta ? edicao.valor : urlConsulta;
  const consultaResultados = useDeferredValue(consulta);
  const atualizando = consulta !== consultaResultados;
  const alterarConsulta = (valor: string) => setEdicao({ origem: urlConsulta, valor });
  const [categoria, setCategoria] = useState("");
  const [sistema, setSistema] = useState("");
  const [nivel, setNivel] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [ordenacao, setOrdenacao] = useState("relevancia");

  const fuse = useMemo(() => criarBuscador(documentos), [documentos]);
  const sugestoes = useMemo(() => [...new Set(documentos.flatMap(doc=>[doc.titulo,...(doc.codigosErro??[])]))].slice(0,100), [documentos]);
  const sistemas = useMemo(() => [...new Set(documentos.map((doc) => doc.sistema))].sort((a, b) => a.localeCompare(b, "pt-BR")), [documentos]);
  const resultadoBusca = useMemo(() => executarBusca(fuse, consultaResultados), [fuse, consultaResultados]);
  const resultados = useMemo(() => {
    const semTermo=consultaResultados.trim().length<MINIMO_CARACTERES_BUSCA;
    const base=semTermo?documentos.map(artigo=>({artigo,pontuacao:1})):resultadoBusca;
    return base.filter(({artigo})=>
      (!categoria||artigo.categoria===categoria)&&(!sistema||artigo.sistema===sistema)&&
      (!nivel||artigo.nivel===nivel)&&(!status||artigo.status===status)&&(!tipo||artigo.tipo===tipo)
    ).sort((a,b)=>ordenacao==="recentes"||semTermo&&ordenacao==="relevancia"
      ?b.artigo.atualizadoEm.localeCompare(a.artigo.atualizadoEm)
      :ordenacao==="az"?a.artigo.titulo.localeCompare(b.artigo.titulo,"pt-BR"):0);
  },[resultadoBusca,documentos,consultaResultados,categoria,sistema,nivel,status,tipo,ordenacao]);
  const filtrosAtivos = Boolean(categoria || sistema || nivel || status || tipo);
  const temTermo = consultaResultados.trim().length >= MINIMO_CARACTERES_BUSCA;
  const explorarSemTermo = !temTermo && filtrosAtivos;

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void fetch("/api/auditoria/acao",{method:"POST",credentials:"same-origin",cache:"no-store",
      headers:{"Content-Type":"application/json"},body:JSON.stringify({evento:"busca_executada"})}).catch(()=>{});
    const termo = consulta.trim().slice(0, 120);
    if(termo.length>=MINIMO_CARACTERES_BUSCA&&executarBusca(fuse,termo).length===0){
      // Registro agregado apenas após busca explícita, sem armazenar a identidade.
      void fetch("/api/busca/lacuna",{method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({termo})}).catch(()=>{});
    }
    router.replace(termo ? `/busca?q=${encodeURIComponent(termo)}` : "/busca", { scroll: false });
  }

  function limparFiltros() {
    setCategoria(""); setSistema(""); setNivel(""); setStatus(""); setTipo(""); setOrdenacao("relevancia");
  }

  return (
    <div>
      <form role="search" onSubmit={enviar} className="cartao p-5 sm:p-6">
        <label className="campo-filtro" htmlFor="campo-consulta"><span>O que você precisa resolver?</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="campo-consulta" list="sugestoes-conhecimento" type="search" className="campo-pesquisa flex-1" value={consulta} onChange={(evento) => alterarConsulta(evento.target.value)} placeholder="Ex.: CLI-DUP-001, cliente duplicado, rejeição..." maxLength={120} autoComplete="off" />
            <button className="botao-primario px-5" type="submit">Pesquisar</button>
          </div>
        </label>
        <datalist id="sugestoes-conhecimento">{sugestoes.map(t=><option key={t} value={t}/>)}</datalist>
        <p className="mt-3 text-xs text-[var(--muted)]">Resultados instantâneos enquanto digita. Pressione Enter para criar um link compartilhável da consulta.</p>
      </form>

      <section aria-label="Filtros da pesquisa" className="mt-5 cartao grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="campo-filtro">Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="">Todas as categorias</option>{categorias.map((item) => <option value={item.slug} key={item.slug}>{item.nome}</option>)}</select>
        </label>
        <label className="campo-filtro">Sistema
          <select value={sistema} onChange={(e) => setSistema(e.target.value)}><option value="">Todos os sistemas</option>{sistemas.map((item) => <option value={item} key={item}>{item}</option>)}</select>
        </label>
        <label className="campo-filtro">Nível
          <select value={nivel} onChange={(e) => setNivel(e.target.value)}><option value="">Todos os níveis</option>{["N1", "N2", "N3"].map((item) => <option value={item} key={item}>{item}</option>)}</select>
        </label>
        <label className="campo-filtro">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{["rascunho", "revisado", "obsoleto"].map((item) => <option value={item} key={item}>{item}</option>)}</select>
        </label>
        <label className="campo-filtro">Tipo de conteúdo
          <select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="">Todos os tipos</option>{TODOS_TIPOS.map(t=><option value={t} key={t}>{TIPOS_CONTEUDO[t].nome}</option>)}</select>
        </label>
        <label className="campo-filtro">Ordenação
          <select value={ordenacao} onChange={e=>setOrdenacao(e.target.value)}><option value="relevancia">Mais relevantes</option><option value="recentes">Atualizados recentemente</option><option value="az">Título A–Z</option></select>
        </label>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]" aria-live="polite" role="status">{atualizando ? "Atualizando resultados..." : temTermo ? `${resultados.length} resultado(s) para “${consultaResultados.trim()}”` : explorarSemTermo ? `${resultados.length} artigo(s) com os filtros selecionados` : `${documentos.length} artigo(s) indexado(s)`}</p>
        {filtrosAtivos && <button className="botao-secundario" type="button" onClick={limparFiltros}>Limpar filtros</button>}
      </div>

      {!temTermo && !explorarSemTermo ? (
        <div className="cartao mt-4 p-8 text-center">
          <h2 className="text-xl font-bold">Comece digitando um termo</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Use pelo menos dois caracteres. Busque por título, código, tutorial, guia, FAQ, tag ou texto do artigo.</p>
          <p className="mt-4 text-sm text-[var(--muted)]">Exemplos:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">{["CLI-DUP-001", "cliente", "duplicidade"].map((termo) => <button className="botao-secundario" key={termo} type="button" onClick={() => alterarConsulta(termo)}>{termo}</button>)}</div>
        </div>
      ) : resultados.length === 0 ? (
        <div className="cartao mt-4 p-8 text-center">
          <h2 className="text-xl font-bold">Nenhum artigo encontrado</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Experimente um termo mais curto, confira o código de erro ou remova os filtros.</p>
          {filtrosAtivos && <button className="botao-secundario mt-4" onClick={limparFiltros} type="button">Remover filtros</button>}
        </div>
      ) : (
        <div className="resultados-busca" aria-busy={atualizando}>
          <ResultadosBusca key={JSON.stringify([consultaResultados, categoria, sistema, nivel, status, tipo, ordenacao])} resultados={resultados} consulta={consultaResultados} />
        </div>
      )}
    </div>
  );
}


// Mantém a lista fora da renderização urgente do campo de texto.
const ResultadosBusca = memo(function ResultadosBusca({ resultados, consulta }: { resultados: ResultadoBusca[]; consulta: string }) {
  const [limite, setLimite] = useState(30);
  return <>
        <div className="lista-animada mt-4 grid gap-4" aria-label="Resultados da pesquisa">
          {resultados.slice(0, limite).map(({ artigo }) => (
            <article className="cartao p-5 sm:p-6" key={artigo.url}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="etiqueta">{artigo.nomeCategoria}</span>
                <span className="etiqueta">{artigo.nivel}</span><span className="etiqueta">{TIPOS_CONTEUDO[artigo.tipo].nome}</span>
                <EtiquetaStatus status={artigo.status} />
              </div>
              <h2 className="mt-3 text-lg font-bold sm:text-xl"><Link className="link-cartao" href={artigo.url}><Destaque texto={artigo.titulo} consulta={consulta} /></Link></h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]"><Destaque texto={artigo.resumo} consulta={consulta} /></p>
              <p className="trecho-busca mt-3 text-sm leading-6"><Destaque texto={trechoEncontrado(artigo.conteudoBusca, consulta)} consulta={consulta} /></p>
              {(artigo.codigosErro ?? []).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(artigo.codigosErro ?? []).map((codigo) => <code className="codigo-erro" key={codigo}><Destaque texto={codigo} consulta={consulta} /></code>)}</div>}
              <p className="mt-4 text-xs text-[var(--muted)]">{artigo.sistema} · Atualizado {formatarData(artigo.atualizadoEm)}</p>
            </article>
          ))}
        </div>
        {limite < resultados.length && <button type="button" className="botao-secundario mt-5" onClick={() => setLimite(valor => valor + 30)}>Mostrar mais resultados ({resultados.length - limite})</button>}
  </>;
});
