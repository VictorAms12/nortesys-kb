"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
type Conta={id:string;avatarCaminho:string|null};
export function MenuConta({nome,papel}:{nome:string;papel:string}){
 const [aberto,setAberto]=useState(false);
 const [conta,setConta]=useState<Conta|null>(null);
 const [falhouImagem,setFalhouImagem]=useState(false);
 const raiz=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let ativo=true;
  const atualizar=()=>{void fetch("/api/perfil",{cache:"no-store",credentials:"same-origin"})
   .then(r=>r.ok?r.json():null).then((p:Conta|null)=>{if(ativo&&p?.id){setConta(p);setFalhouImagem(false);}}).catch(()=>{});};
  atualizar();
  window.addEventListener("kb-perfil-atualizado",atualizar);
  const canal=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("kb-perfil-atualizado"):null;
  if(canal)canal.onmessage=atualizar;
  return()=>{ativo=false;window.removeEventListener("kb-perfil-atualizado",atualizar);canal?.close();};
 },[]);
 useEffect(()=>{
  if(!aberto)return;
  const tecla=(e:KeyboardEvent)=>{if(e.key==="Escape")setAberto(false);};
  const fora=(e:PointerEvent)=>{if(e.target instanceof Node&&!raiz.current?.contains(e.target))setAberto(false);};
  window.addEventListener("keydown",tecla);document.addEventListener("pointerdown",fora);
  return()=>{window.removeEventListener("keydown",tecla);document.removeEventListener("pointerdown",fora);};
 },[aberto]);
 return <div className="menu-conta-ancora" ref={raiz}>
  <button type="button" className="botao-icone menu-conta-gatilho" aria-haspopup="menu"
   aria-expanded={aberto} title={"Conta de "+nome} aria-label="Abrir menu da conta" onClick={()=>setAberto(x=>!x)}>
   {conta?.avatarCaminho&&!falhouImagem?
    <Image src={"/api/perfil/avatar/"+conta.id+"?v="+encodeURIComponent(conta.avatarCaminho.split("/").at(-1)??"0")}
     alt="" width={36} height={36} unoptimized onError={()=>setFalhouImagem(true)} className="h-8 w-8 rounded-lg object-cover"/>:
    <span className="menu-conta-inicial" aria-hidden="true">{nome.trim().slice(0,1).toUpperCase()}</span>}
  </button>
  {aberto&&<section className="menu-conta-painel" role="menu" aria-label="Opções da conta">
   <div className="menu-conta-cabecalho">
    <strong className="block truncate text-sm">{nome}</strong>
    <span className="block text-xs text-[var(--muted)] capitalize">{papel}</span>
   </div>
   <Link href="/perfil" role="menuitem" className="menu-conta-item" onClick={()=>setAberto(false)}>Meu perfil e preferências</Link>
   <Link href="/chat" role="menuitem" className="menu-conta-item" onClick={()=>setAberto(false)}>Chat da equipe</Link>
   <div className="menu-conta-divisor"/>
   <form action="/api/autenticacao/sair" method="post">
    <button type="submit" role="menuitem" className="menu-conta-item w-full text-left">Sair da conta</button>
   </form>
  </section>}
 </div>;
}
