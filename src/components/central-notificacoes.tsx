"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
type Aviso={id:number;conversaId:string;autor:string;criadaEm:string;vistaEm:string|null;tipo:string};
type Dados={itens:Aviso[];naoLidas:number;indisponivel?:boolean};
export function CentralNotificacoes(){
 const [dados,setDados]=useState<Dados>({itens:[],naoLidas:0});
 const [aberto,setAberto]=useState(false);
 const [aviso,setAviso]=useState("");
 const ultimo=useRef<number|null>(null);
 const atualizar=useCallback(async()=>{
  if(document.hidden)return;
  try{
   const r=await fetch("/api/notificacoes",{cache:"no-store",credentials:"same-origin"});
   if(!r.ok)return;
   const d=await r.json() as Dados;
   if(d.indisponivel)return;
   const maior=Math.max(0,...d.itens.map(x=>x.id));
   if(ultimo.current!==null&&maior>ultimo.current&&location.pathname!=="/chat")
    setAviso("Nova mensagem no chat da equipe");
   ultimo.current=maior;
   setDados(d);
  }catch{/* Mantém o restante do sistema utilizável. */}
 },[]);
 useEffect(()=>{
  const inicial=window.setTimeout(()=>void atualizar(),0);
  const intervalo=window.setInterval(()=>void atualizar(),12000);
  const visivel=()=>void atualizar();
  window.addEventListener("focus",visivel);
  document.addEventListener("visibilitychange",visivel);
  return ()=>{window.clearTimeout(inicial);window.clearInterval(intervalo);window.removeEventListener("focus",visivel);document.removeEventListener("visibilitychange",visivel);};
 },[atualizar]);
 useEffect(()=>{
  if(!aviso)return;
  const t=window.setTimeout(()=>setAviso(""),5000);return()=>window.clearTimeout(t);
 },[aviso]);
 useEffect(()=>{
  const original=document.title;
  if(dados.naoLidas)document.title="("+Math.min(dados.naoLidas,99)+(dados.naoLidas>99?"+":"")+") Nortesys KB";
  return ()=>{document.title=original;};
 },[dados.naoLidas]);
 async function marcar(id:number|null){
  try{
   const r=await fetch("/api/notificacoes",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify(id===null?{todas:true}:{ids:[id]})});
   if(!r.ok)return;
   setDados(d=>({...d,itens:d.itens.map(x=>id===null||x.id===id?{...x,vistaEm:new Date().toISOString()}:x),
    naoLidas:id===null?0:Math.max(0,d.naoLidas-1)}));
  }catch{/* Tente novamente mais tarde. */}
 }
 return <>
  <div className="relative">
   <button type="button" className="botao-icone relative" onClick={()=>setAberto(v=>!v)}
    aria-expanded={aberto} aria-label="Notificações" title="Notificações">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/></svg>
    {dados.naoLidas>0&&<span className="contador-notificacoes">{dados.naoLidas>99?"99+":dados.naoLidas}</span>}
   </button>
   {aberto&&<section className="painel-notificacoes" aria-label="Notificações recebidas">
    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-3">
     <strong>Notificações</strong><button type="button" className="text-xs underline" onClick={()=>void marcar(null)}>Marcar lidas</button>
    </div>
    <div className="max-h-80 overflow-y-auto">{dados.itens.length?dados.itens.map(n=>
      <Link key={n.id} href={"/chat?conversa="+encodeURIComponent(n.conversaId)}
       onClick={()=>{setAberto(false);if(!n.vistaEm)void marcar(n.id);}}
       className={"notificacao-item "+(!n.vistaEm?"nao-lida":"")}>
       <strong className="block text-sm">{n.autor}</strong>
       <span className="text-xs text-[var(--muted)]">Nova mensagem {n.tipo==="geral"?"na equipe":"em conversa privada"}</span>
      </Link>):<p className="p-4 text-sm text-[var(--muted)]">Nenhum aviso recente.</p>}</div>
   </section>}
  </div>
  {aviso&&<Link href="/chat" className="toast-mensagem" onClick={()=>setAviso("")} role="status">{aviso}</Link>}
 </>;
}
