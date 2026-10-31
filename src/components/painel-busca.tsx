"use client";

import { memo, useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { categorias } from "../../config/categorias";
import { criarBuscador, executarBusca, MINIMO_CARACTERES_BUSCA, trechoEncontrado, type ResultadoBusca } from "../lib/busca";
import { formatarData } from "../lib/apresentacao";
import type { DocumentoBusca } from "../lib/indice-busca";
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
  const [registrando,setRegistrando]=useState(false);
  const [registro,setRegistro]=useState("");

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


  const quantidade=(numero:number,nome:string)=>numero+" "+nome+(numero===1?"":"s");
  async function registrarLacuna(){
    const termo=consulta.trim().slice(0,120);
    if(termo.length<MINIMO_CARACTERES_BUSCA||registrando)return;
    setRegistrando(true);setRegistro("");
    try{
      const r=await fetch("/api/busca/lacuna",{method:"POST",cache:"no-store",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({termo})});
      if(!r.ok)throw Error();
      setRegistro("Lacuna registrada para revisão pela equipe.");
    }catch{setRegistro("Não foi possível registrar a lacuna agora.");}
    finally{setRegistrando(false);}
  }
  return <div className="painel-busca">
    <form role="search" onSubmit={enviar} className="form-busca-principal">
      <label htmlFor="campo-consulta">Buscar por erro, código ou procedimento</label>
      <div className="form-busca-linha">
       <input id="campo-consulta" list="sugestoes-conhecimento" type="search"
         className="campo-pesquisa" value={consulta} onChange={e=>alterarConsulta(e.target.value)}
         placeholder="Ex.: cliente duplicado, rejeição 539, NF-e" maxLength={120} autoComplete="off"/>
       <button className="botao-primario" type="submit">Buscar</button>
      </div>
      <datalist id="sugestoes-conhecimento">{sugestoes.map(t=><option key={t} value={t}/>)}</datalist>
    </form>
    <section aria-label="Filtros da pesquisa" className="barra-filtros">
      <label className="campo-filtro">Categoria
        <select value={categoria} onChange={e=>setCategoria(e.target.value)}>
         <option value="">Todas</option>{categorias.map(item=><option value={item.slug} key={item.slug}>{item.nome}</option>)}
        </select>
      </label>
      <label className="campo-filtro">Sistema
        <select value={sistema} onChange={e=>setSistema(e.target.value)}>
         <option value="">Todos</option>{sistemas.map(item=><option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label className="campo-filtro">Nível
        <select value={nivel} onChange={e=>setNivel(e.target.value)}>
         <option value="">Todos</option>{["N1","N2","N3"].map(item=><option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <details className="mais-filtros">
       <summary>Mais filtros{status||tipo||ordenacao!=="relevancia"?" · ativo":""}</summary>
       <div className="mais-filtros-conteudo">
        <label className="campo-filtro">Status
         <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Todos</option>{["rascunho","revisado","obsoleto"].map(item=><option value={item} key={item}>{item}</option>)}
         </select>
        </label>
        <label className="campo-filtro">Tipo
         <select value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="">Todos</option>{TODOS_TIPOS.map(t=><option value={t} key={t}>{TIPOS_CONTEUDO[t].nome}</option>)}
         </select>
        </label>
        <label className="campo-filtro">Ordenar
         <select value={ordenacao} onChange={e=>setOrdenacao(e.target.value)}>
          <option value="relevancia">Relevância</option><option value="recentes">Atualização</option><option value="az">Título A–Z</option>
         </select>
        </label>
       </div>
      </details>
    </section>
    {filtrosAtivos&&<div className="filtros-ativos" aria-label="Filtros ativos">
     {categoria&&<button type="button" onClick={()=>setCategoria("")}>Categoria: {categorias.find(c=>c.slug===categoria)?.nome??categoria} <span aria-hidden="true">×</span></button>}
     {sistema&&<button type="button" onClick={()=>setSistema("")}>Sistema: {sistema} <span aria-hidden="true">×</span></button>}
     {nivel&&<button type="button" onClick={()=>setNivel("")}>Nível: {nivel} <span aria-hidden="true">×</span></button>}
     {status&&<button type="button" onClick={()=>setStatus("")}>Status: {status} <span aria-hidden="true">×</span></button>}
     {tipo&&<button type="button" onClick={()=>setTipo("")}>Tipo: {TIPOS_CONTEUDO[tipo as keyof typeof TIPOS_CONTEUDO]?.nome??tipo} <span aria-hidden="true">×</span></button>}
     <button type="button" className="limpar-todos" onClick={limparFiltros}>Limpar tudo</button>
    </div>}
    <div className="resultado-contagem" role="status" aria-live="polite">
     {atualizando?"Atualizando resultados...":temTermo?
       quantidade(resultados.length,"resultado")+" para “"+consultaResultados.trim()+"”":
       explorarSemTermo?quantidade(resultados.length,"artigo")+" com os filtros selecionados":
       quantidade(documentos.length,"artigo")+" indexados"}
    </div>
    {!temTermo&&!explorarSemTermo?
     <div className="estado-vazio">
      <strong>Pesquise por título, código de erro ou procedimento.</strong>
      <p>Use pelo menos dois caracteres. Experimente:</p>
      <div className="sugestoes-termos">{(sugestoes.length?sugestoes.slice(0,3):["NF-e","CFOP","VPN"]).map(t=>
        <button key={t} type="button" onClick={()=>alterarConsulta(t)}>{t}</button>)}</div>
     </div>:resultados.length===0?
     <div className="estado-vazio">
      <strong>Nenhum artigo encontrado.</strong>
      <p>Confira o código, tente termos mais curtos ou remova filtros.</p>
      <div className="flex flex-wrap gap-2 mt-3">
       {filtrosAtivos&&<button className="botao-secundario" type="button" onClick={limparFiltros}>Remover filtros</button>}
       {temTermo&&<button className="botao-secundario" type="button" disabled={registrando} onClick={()=>void registrarLacuna()}>
        {registrando?"Registrando...":"Registrar lacuna"}</button>}
      </div>
      {registro&&<p role="status" className="mt-2">{registro}</p>}
     </div>:
     <div className="resultados-busca" aria-busy={atualizando}>
      <ResultadosBusca key={JSON.stringify([consultaResultados,categoria,sistema,nivel,status,tipo,ordenacao])} resultados={resultados} consulta={consultaResultados}/>
     </div>}
  </div>;
}

const ResultadosBusca=memo(function ResultadosBusca({resultados,consulta}:{resultados:ResultadoBusca[];consulta:string}){
 const [limite,setLimite]=useState(30);
 return <>
  <div className="lista-resultados" aria-label="Resultados da pesquisa">
   {resultados.slice(0,limite).map(({artigo})=><article className="resultado-linha" key={artigo.url}>
    <h2><Link href={artigo.url}><Destaque texto={artigo.titulo} consulta={consulta}/></Link>
     {(artigo.codigosErro??[]).map(c=><code key={c} className="codigo-erro"><Destaque texto={c} consulta={consulta}/></code>)}
    </h2>
    <div className="metadados-linha">
     <span>{artigo.nomeCategoria}</span><span aria-hidden="true">·</span><span>{artigo.sistema}</span>
     <span aria-hidden="true">·</span><span>{artigo.nivel}</span><span aria-hidden="true">·</span>
     <time dateTime={artigo.atualizadoEm}>{formatarData(artigo.atualizadoEm)}</time>
    </div>
    <p className="trecho-resultado"><Destaque texto={trechoEncontrado(artigo.conteudoBusca,consulta)} consulta={consulta}/></p>
   </article>)}
  </div>
  {limite<resultados.length&&<button type="button" className="botao-secundario mt-4" onClick={()=>setLimite(x=>x+30)}>Mostrar mais ({resultados.length-limite})</button>}
 </>;
});
