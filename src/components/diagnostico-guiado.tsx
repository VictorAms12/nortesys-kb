"use client";

import Link from "next/link";
import {useMemo,useState} from "react";
import {FLUXOS_DIAGNOSTICO,encontrarFluxo} from "../lib/diagnostico";
import {criarBuscador,executarBusca} from "../lib/busca";
import type {DocumentoBusca} from "../lib/indice-busca";

export function DiagnosticoGuiado({documentos}:{documentos:DocumentoBusca[]}) {
  const [fluxoId,setFluxoId]=useState("");
  const [etapaId,setEtapaId]=useState("");
  const [historico,setHistorico]=useState<string[]>([]);
  const [codigo,setCodigo]=useState("");
  const fluxo=encontrarFluxo(fluxoId);
  const etapa=fluxo?.etapas[etapaId];
  const buscador=useMemo(()=>criarBuscador(documentos),[documentos]);
  const consulta=etapa?.solicitarCodigo ? codigo.trim() : etapa?.pesquisa ?? "";
  const indicados=consulta.length>=2?executarBusca(buscador,consulta).slice(0,4):[];
  function selecionar(id:string) {const escolhido=encontrarFluxo(id);setFluxoId(id);setEtapaId(escolhido?.inicio??"");setHistorico([]);setCodigo("");}
  function avancar(id:string) {setHistorico(atuais=>[...atuais,etapaId]);setEtapaId(id);setCodigo("");}
  function voltar() {const anterior=historico.at(-1);if(!anterior){selecionar("");return;}setEtapaId(anterior);setHistorico(atuais=>atuais.slice(0,-1));setCodigo("");}
  return <div className="grid gap-5">
    {!fluxo?<section className="diagnosticos-lista" aria-label="Escolha um diagnóstico">
      {FLUXOS_DIAGNOSTICO.map(f=><button key={f.id} type="button" className="diagnostico-opcao text-left" onClick={()=>selecionar(f.id)}>
        <h2 className="font-bold text-lg">{f.titulo}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{f.descricao}</p>
        <span className="mt-2 inline-block text-xs text-[var(--link)]">Iniciar triagem</span>
      </button>)}
    </section>: <section className="cartao grid gap-4 p-5 sm:p-7">
      <div><p className="sobre-titulo">{fluxo.titulo}</p><h2 className="titulo-secao mt-2">{etapa?.titulo}</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{etapa?.descricao}</p></div>
      {etapa?.opcoes && <div className="grid gap-2">{etapa.opcoes.map(op=>
        <button key={op.proximo} type="button" className="botao-secundario text-left" onClick={()=>avancar(op.proximo)}>{op.rotulo}</button>
      )}</div>}
      {etapa?.solicitarCodigo && <label className="grid gap-2 text-sm font-semibold">Código ou mensagem exata
        <input className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
          value={codigo} maxLength={120} placeholder="Ex.: 590 ou mensagem de rejeição" onChange={e=>setCodigo(e.target.value)} />
      </label>}
      {!etapa?.opcoes && <div className="grid gap-3">
        {consulta.length>=2 ? <>
          <Link className="botao-primario w-fit" href={"/busca?q="+encodeURIComponent(consulta)}>Pesquisar na base: {consulta}</Link>
          <h3 className="text-sm font-bold">Artigos encontrados</h3>
          {indicados.length?indicados.map(item=><Link key={item.artigo.url} href={item.artigo.url}
            className="rounded-lg border border-[var(--border)] p-3 hover:border-[var(--primary)]">
            <strong>{item.artigo.titulo}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.artigo.resumo}</span>
          </Link>):<p className="text-sm text-[var(--muted)]">Nenhum artigo correspondente. Consulte a busca ou escale o atendimento seguindo o procedimento interno.</p>}
        </> : <p className="text-sm text-[var(--muted)]">Digite pelo menos dois caracteres para localizar procedimentos.</p>}
      </div>}
      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <button type="button" className="botao-secundario" onClick={voltar}>← Voltar</button>
        <button type="button" className="botao-secundario" onClick={()=>selecionar("")}>Reiniciar diagnóstico</button>
      </div>
    </section>}
    <p className="text-sm leading-6 text-[var(--muted)]">Esta triagem organiza a investigação, mas não confirma causas nem substitui a validação técnica e fiscal. Os links levam somente a artigos que sua conta pode consultar.</p>
  </div>;
}
