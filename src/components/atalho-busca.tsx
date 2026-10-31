"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {IconeInterface} from "./icone-interface";

type Sugestao={url:string;titulo:string;categoria:string;codigos:string[]};
export function AtalhoBusca(){
 const [consulta,setConsulta]=useState("");
 const [resultados,setResultados]=useState<Sugestao[]>([]);
 const [aberto,setAberto]=useState(false);
 const [indice,setIndice]=useState(-1);
 const [carregando,setCarregando]=useState(false);
 const [falha,setFalha]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const raiz=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const foco=(evento:KeyboardEvent)=>{
   const alvo=evento.target as HTMLElement|null;
   const digitando=alvo?.matches('input,textarea,[contenteditable="true"]');
   if(((evento.ctrlKey||evento.metaKey)&&evento.key.toLowerCase()==="k")||
      (evento.key==="/"&&!digitando&&!evento.ctrlKey&&!evento.metaKey&&!evento.altKey)){
    evento.preventDefault();inputRef.current?.focus();inputRef.current?.select();setAberto(true);
   }
  };
  document.addEventListener("keydown",foco);
  const fora=(evento:PointerEvent)=>{
   if(evento.target instanceof Node&&!raiz.current?.contains(evento.target))setAberto(false);
  };
  document.addEventListener("pointerdown",fora);
  return()=>{document.removeEventListener("keydown",foco);document.removeEventListener("pointerdown",fora);};
 },[]);
 useEffect(()=>{
  if(consulta.trim().length<2)return;
  const controller=new AbortController();
  const t=window.setTimeout(async()=>{
   try{
    const r=await fetch("/api/busca/sugestoes?q="+encodeURIComponent(consulta.slice(0,120)),
      {cache:"no-store",signal:controller.signal});
    if(!r.ok)throw Error();
    const d=await r.json() as {resultados:Sugestao[]};
    setResultados(d.resultados??[]);setIndice(-1);setFalha(false);
   }catch{if(!controller.signal.aborted){setResultados([]);setFalha(true);}}
   finally{if(!controller.signal.aborted)setCarregando(false);}
  },220);
  return()=>{controller.abort();window.clearTimeout(t);};
 },[consulta]);
 function mudar(valor:string){setConsulta(valor);setResultados([]);setIndice(-1);setFalha(false);setCarregando(valor.trim().length>=2);setAberto(true);}
 function teclado(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==="Escape"){e.preventDefault();setAberto(false);inputRef.current?.blur();return;}
  if(e.key==="ArrowDown"&&resultados.length){e.preventDefault();setIndice(i=>(i+1)%resultados.length);setAberto(true);}
  if(e.key==="ArrowUp"&&resultados.length){e.preventDefault();setIndice(i=>(i<=0?resultados.length-1:i-1));setAberto(true);}
  if(e.key==="Enter"&&aberto&&indice>=0&&resultados[indice]){
   e.preventDefault();window.location.assign(resultados[indice].url);
  }
 }
 const visivel=aberto&&consulta.trim().length>=2;
 return <div className="busca-topbar" ref={raiz}>
  <form className="busca-cabecalho" role="search" action="/busca" method="get">
   <label htmlFor="busca-global" className="sr-only">Buscar por erro, código ou procedimento</label>
   <IconeInterface nome="busca" width={16} height={16}/>
   <input id="busca-global" ref={inputRef} name="q" type="search" autoComplete="off" maxLength={120}
    placeholder="Buscar por erro, código ou procedimento" value={consulta} onChange={e=>mudar(e.target.value)}
    onKeyDown={teclado} onFocus={()=>setAberto(true)}
    role="combobox" aria-autocomplete="list" aria-expanded={visivel} aria-controls="sugestoes-busca"
    aria-activedescendant={visivel&&indice>=0?"sugestao-busca-"+indice:undefined}/>
   <kbd className="atalho-teclado" aria-hidden="true">/</kbd>
  </form>
  {visivel&&<div id="sugestoes-busca" role="listbox" aria-label="Resultados instantâneos" className="dropdown-busca">
    {resultados.map((r,i)=><Link key={r.url} href={r.url} id={"sugestao-busca-"+i} role="option"
     aria-selected={indice===i} className={"opcao-busca "+(indice===i?"opcao-busca-ativa":"")}
     onMouseEnter={()=>setIndice(i)} onClick={()=>setAberto(false)}>
      <strong>{r.titulo}</strong><small>{r.categoria}{r.codigos.length?" · "+r.codigos.join(", "):""}</small>
     </Link>)}
    {carregando&&<p className="dropdown-mensagem" role="status">Buscando...</p>}
    {!carregando&&falha&&<p className="dropdown-mensagem">Resultados instantâneos indisponíveis. Pressione Enter para pesquisar.</p>}
    {!carregando&&!falha&&resultados.length===0&&<p className="dropdown-mensagem">Nenhuma sugestão encontrada.</p>}
    <div className="dropdown-rodape">↑↓ navegar · Enter abrir · Esc fechar</div>
   </div>}
 </div>;
}
