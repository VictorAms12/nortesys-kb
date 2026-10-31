"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {IconeInterface} from "./icone-interface";
export function IndicadorChat(){
 const pathname=usePathname();
 const [naoLidas,setNaoLidas]=useState(0);
 const ultimoMovimento=useRef(0);
 useEffect(()=>{
  let vivo=true;
  async function atualizar(){
    if(document.hidden)return;
    try{
      const r=await fetch("/api/chat/nao-lidas",{cache:"no-store",credentials:"same-origin"});
      if(!r.ok)return;
      const j=await r.json() as {total:number};
      if(vivo)setNaoLidas(Math.max(0,Number(j.total)||0));
    }catch{/* Não bloquear interface quando chat estiver indisponível. */}
  }
  const marcar=()=>{ultimoMovimento.current=Date.now();};
  const ping=()=>{
    if(document.hidden||pathname==="/chat")return; // ChatPainel cuida da presença na rota /chat.
    void fetch("/api/chat",{method:"POST",credentials:"same-origin",cache:"no-store",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({acao:"presenca",ativo:Date.now()-ultimoMovimento.current<5*60*1000})}).catch(()=>{});
  };
  marcar();void atualizar();ping();
  const t=window.setInterval(()=>{void atualizar();ping();},45000);
  for(const evt of ["pointerdown","keydown","mousemove","touchstart"])window.addEventListener(evt,marcar,{passive:true});
  window.addEventListener("focus",atualizar);
  return ()=>{vivo=false;window.clearInterval(t);window.removeEventListener("focus",atualizar);
    for(const evt of ["pointerdown","keydown","mousemove","touchstart"])window.removeEventListener(evt,marcar);};
 },[pathname]);
 return <Link href="/chat" title="Abrir chat da equipe" aria-label={"Chat da equipe"+(naoLidas?" — "+naoLidas+" mensagens não lidas":"")}
   className="botao-icone relative inline-flex items-center justify-center" prefetch={false}>
   <IconeInterface nome="mensagem"/>
   {naoLidas>0&&<span className="absolute -right-2 -top-2 contador-notificacoes">{naoLidas>99?"99+":naoLidas}</span>}
 </Link>;
}
