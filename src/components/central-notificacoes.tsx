"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useCallback,useEffect,useRef,useState} from "react";
import {reservarAlerta} from "../lib/notificacoes-client";
import {obterPerfilCompartilhado} from "../lib/perfil-cliente";
type Aviso={id:string;conversaId:string;autor:string;criadaEm:string;vistaEm:string|null;tipo:string};
type Dados={itens:Aviso[];naoLidas:number;indisponivel?:boolean};
function depois(id:string,atual:string){return id.length>atual.length||(id.length===atual.length&&id>atual);}
export function CentralNotificacoes(){
 const [dados,setDados]=useState<Dados>({itens:[],naoLidas:0});
 const pathname=usePathname();
 const [aberto,setAberto]=useState(false);
 const [falhaSincronizacao,setFalhaSincronizacao]=useState(false);
 const [aviso,setAviso]=useState<{texto:string;conversaId:string}|null>(null);
 const ancora=useRef<HTMLDivElement|null>(null);
 const sincronizacao=useRef<BroadcastChannel|null>(null);
 const ultimo=useRef<string|null>(null);
 const identidade=useRef("anon");
 const consultaAtual=useRef(0);
 const tempoRealConectado=useRef(false);
 const ultimaReconciliacao=useRef(0);

 const preferencias=useRef({avisos:true,navegador:false,geral:true});
 const atualizar=useCallback(async()=>{
  const versao=++consultaAtual.current;
  try{
   const r=await fetch("/api/notificacoes",{cache:"no-store",credentials:"same-origin"});
   if(r.status===401){
    setDados({itens:[],naoLidas:0});
    setAviso(null);
    window.location.replace("/entrar");
    return;
   }
   if(!r.ok){setFalhaSincronizacao(true);return;}
   const d=await r.json() as Dados;
   if(versao!==consultaAtual.current)return;
   if(d.indisponivel){setFalhaSincronizacao(true);return;}
   setFalhaSincronizacao(false);
   const maior=d.itens.reduce((m,x)=>depois(x.id,m)?x.id:m,"0");
   const recentes=d.itens.filter(x=>!x.vistaEm&&ultimo.current!==null&&depois(x.id,ultimo.current));
   const nova=recentes.find(x=>x.tipo!=="geral"||preferencias.current.geral);
   if(nova){
    const toast=preferencias.current.avisos&&!document.hidden&&location.pathname!=="/chat";
    const nativo=document.hidden&&preferencias.current.navegador&&"Notification" in window&&Notification.permission==="granted";
    let pushAtivo=false;
    if(nativo&&"serviceWorker" in navigator){
     try{
      const reg=await navigator.serviceWorker.getRegistration("/kb-notification-worker.js");
      pushAtivo=Boolean(await reg?.pushManager?.getSubscription());
     }catch{/* Não interromper avisos internos. */}
    }
    if((toast||(nativo&&!pushAtivo))&&await reservarAlerta(nova.id,identidade.current)){
     if(toast)setAviso({texto:"Nova mensagem de "+nova.autor,conversaId:nova.conversaId});
     if(nativo&&!pushAtivo){
      const alerta=new Notification("Nova mensagem no Nortesys KB",{
       body:"Abra o site para consultar a conversa.",tag:"kb-chat"});
      alerta.onclick=()=>{window.focus();window.location.assign("/chat?conversa="+encodeURIComponent(nova.conversaId));alerta.close();};
     }
    }
   }
   if(ultimo.current===null||depois(maior,ultimo.current))ultimo.current=maior;
   if(versao===consultaAtual.current)setDados(d);
  }catch{setFalhaSincronizacao(true);/* Mantém o último estado útil. */}
 },[]);
 useEffect(()=>{
  if(typeof BroadcastChannel!=="undefined"){
   const canal=new BroadcastChannel("kb-notificacoes-atualizadas");
   canal.onmessage=(evento:MessageEvent)=>{
    if(evento.data?.tipo==="preferencias"&&evento.data.preferencias){
     preferencias.current=evento.data.preferencias;
     ultimo.current=null;
    }
    void atualizar();
   };
   sincronizacao.current=canal;
  }
  const mudanca=(e:Event)=>{
   const p=(e as CustomEvent).detail;
   if(p){preferencias.current=p;ultimo.current=null;}
   void atualizar();
  };
  window.addEventListener("kb-preferencias-atualizadas",mudanca);
  window.addEventListener("kb-notificacoes-atualizadas",atualizar);
  void obterPerfilCompartilhado().then(d=>{
   if(d?.id)identidade.current=d.id;
   if(d?.preferencias)preferencias.current=d.preferencias;
  }).catch(()=>{});
  const inicial=window.setTimeout(()=>void atualizar(),0);
  const intervalo=window.setInterval(()=>{
   if(document.hidden)return;
   if(tempoRealConectado.current&&Date.now()-ultimaReconciliacao.current<300_000)return;
   ultimaReconciliacao.current=Date.now();
   void atualizar();
  },60_000);
  const visivel=()=>{if(!document.hidden)void atualizar();};
  window.addEventListener("focus",visivel);
  document.addEventListener("visibilitychange",visivel);
  return ()=>{window.clearTimeout(inicial);window.clearInterval(intervalo);window.removeEventListener("focus",visivel);document.removeEventListener("visibilitychange",visivel);sincronizacao.current?.close();sincronizacao.current=null;window.removeEventListener("kb-preferencias-atualizadas",mudanca);window.removeEventListener("kb-notificacoes-atualizadas",atualizar);};
 },[atualizar]);
 useEffect(()=>{
  // O chat já mantém seu próprio fluxo; nas demais páginas usamos SSE de leitura.
  if(pathname==="/chat")return;
  let encerrado=false;
  let canal:EventSource|null=null;
  let renovar:number|undefined;
  let ultimoEvento="";
  let eventoEm=0;
  const conectar=async()=>{
   canal?.close();canal=null;
   try{
    const resposta=await fetch("/api/chat/token",{cache:"no-store",credentials:"same-origin"});
    if(!resposta.ok)throw Error("Realtime indisponível");
    const token=await resposta.json() as {token:string;channels:string[];expires:number};
    if(encerrado||!token?.token||!token.channels?.length)return;
    const params=new URLSearchParams({channels:token.channels.join(","),v:"1.2",accessToken:token.token});
    if(ultimoEvento&&Date.now()-eventoEm<110000)params.set("lastEvent",ultimoEvento);
    canal=new EventSource("https://main.realtime.ably.net/sse?"+params);
    canal.onopen=()=>{tempoRealConectado.current=true;};
    canal.onerror=()=>{tempoRealConectado.current=false;};
    canal.onmessage=e=>{
     if(e.lastEventId){ultimoEvento=e.lastEventId;eventoEm=Date.now();}
     try{
      const msg=JSON.parse(e.data) as {name?:string};
      if(msg.name==="chat_mensagem"||msg.name==="chat_alteracao"){
       window.dispatchEvent(new Event("kb-chat-atualizado"));
       void atualizar();
      }
     }catch{/* Evento ignorado; polling mantém recuperação. */}
    };
    // Token dura 30 minutos. Renovar antes da expiração e fechar a conexão antiga.
    renovar=window.setTimeout(()=>{if(!encerrado)void conectar();},Math.max(60000,Math.min(25*60000,token.expires-Date.now()-60000)));
   }catch{
    if(!encerrado)renovar=window.setTimeout(()=>void conectar(),60000);
   }
  };
  void conectar();
  return()=>{encerrado=true;tempoRealConectado.current=false;canal?.close();if(renovar!==undefined)window.clearTimeout(renovar);};
 },[pathname,atualizar]);
 useEffect(()=>{
  if(!aberto)return;
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setAberto(false);};
  const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!ancora.current?.contains(e.target))setAberto(false);};
  document.addEventListener("keydown",key);
  document.addEventListener("pointerdown",outside);
  return()=>{document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",outside);};
 },[aberto]);
 useEffect(()=>{
  if(!aviso)return;
  const t=window.setTimeout(()=>setAviso(null),5000);return()=>window.clearTimeout(t);
 },[aviso]);
 useEffect(()=>{
  const original=document.title.replace(/^\(\d+\+?\)\s+/,"");
  document.title=dados.naoLidas?"("+Math.min(dados.naoLidas,99)+(dados.naoLidas>99?"+":"")+") "+original:original;
  return ()=>{document.title=original;};
 },[dados.naoLidas]);
 async function marcar(id:string|null){
  try{
   const r=await fetch("/api/notificacoes",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify(id===null?{todas:true}:{ids:[id]})});
   if(!r.ok)return;
   // Descarta GETs iniciados antes da confirmação e reconcilia com o servidor.
   consultaAtual.current++;
   setDados(d=>({...d,itens:d.itens.map(x=>id===null||x.id===id?{...x,vistaEm:new Date().toISOString()}:x),
    naoLidas:id===null?0:Math.max(0,d.naoLidas-(d.itens.some(x=>x.id===id&&!x.vistaEm)?1:0))}));
   sincronizacao.current?.postMessage({tipo:"lido"});
   void atualizar();
  }catch{/* Tente novamente mais tarde. */}
 }
 return <>
  <div className="relative" ref={ancora}>
   <button type="button" className="botao-icone relative" onClick={()=>setAberto(v=>!v)}
    aria-expanded={aberto} aria-label="Notificações" title="Notificações">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/></svg>
    {dados.naoLidas>0&&<span className="contador-notificacoes">{dados.naoLidas>99?"99+":dados.naoLidas}</span>}
   </button>
   {aberto&&<section className="painel-notificacoes" aria-label="Notificações recebidas">
    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-3">
     <strong>Notificações</strong><button type="button" className="text-xs underline" onClick={()=>void marcar(null)}>Marcar lidas</button>
    </div>
    {falhaSincronizacao&&<p role="status" className="border-b border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">Não foi possível sincronizar as notificações. Tentaremos novamente.</p>}
    <div className="max-h-80 overflow-y-auto">{dados.itens.length?dados.itens.map(n=>
      <Link key={n.id} href={"/chat?conversa="+encodeURIComponent(n.conversaId)}
       onClick={()=>{setAberto(false);if(!n.vistaEm)void marcar(n.id);}}
       className={"notificacao-item "+(!n.vistaEm?"nao-lida":"")}>
       <strong className="block text-sm">{n.autor}</strong>
       <span className="text-xs text-[var(--muted)]">Nova mensagem {n.tipo==="geral"?"na equipe":"em conversa privada"}</span>
      </Link>):<p className="p-4 text-sm text-[var(--muted)]">Nenhum aviso recente.</p>}</div>
   </section>}
  </div>
  {aviso&&<Link href={"/chat?conversa="+encodeURIComponent(aviso.conversaId)} className="toast-mensagem" onClick={()=>setAviso(null)} role="status">{aviso.texto}<span className="block text-xs opacity-80">Abrir conversa</span></Link>}
 </>;
}
