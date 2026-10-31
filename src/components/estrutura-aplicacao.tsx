"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AlternarTema } from "./alternar-tema";
import { AtalhoBusca } from "./atalho-busca";
import { IndicadorChat } from "./indicador-chat";
import { CentralNotificacoes } from "./central-notificacoes";
import { MenuConta } from "./menu-conta";
import { IconeInterface, type NomeIcone } from "./icone-interface";
import { lerPreferencia, salvarPreferencia } from "../lib/preferencias-navegador";
import {categorias} from "../../config/categorias";

type Papel = "administrador" | "editor" | "leitor";
type Destino = {href:string; texto:string; icone:NomeIcone; prefixo?:boolean; titulo?:string};
const CHAVE = "nortesys-kb-sidebar-recolhida";
const EVENTO = "nortesys-kb-sidebar-alterada";
const principal:Destino[]=[
 {href:"/",texto:"Início",icone:"inicio"},
 {href:"/chat",texto:"Chat da equipe",icone:"mensagem"},
 {href:"/favoritos",texto:"Favoritos",icone:"favoritos"},
 {href:"/recentes",texto:"Recentes",icone:"recentes"},
];
const destinosCategorias:Destino[]=categorias.filter(c=>c.slug!=="procedimentos-e-boas-praticas")
 .map(c=>({href:"/categorias/"+c.slug,texto:c.nome,icone:c.icone as NomeIcone}));
const ferramentas:Destino[]=[
 {href:"/diagnostico",texto:"Diagnóstico",icone:"diagnostico"},
 {href:"/ferramentas/registro",texto:"Registro técnico",icone:"registro"},
 {href:"/artigos",texto:"Todos os artigos",icone:"livro"},
 {href:"/categorias/procedimentos-e-boas-praticas",texto:"Procedimentos",icone:"procedimentos"},
];
const admin:Destino[] = [
  {href:"/admin",texto:"Visão geral",icone:"painel"},
  {href:"/admin/artigos",texto:"Gerenciar artigos",icone:"artigos"},
  {href:"/admin/usuarios",texto:"Usuários",icone:"usuarios"},
  {href:"/admin/auditoria",texto:"Auditoria",icone:"auditoria"},
  {href:"/admin/indicadores",texto:"Indicadores",icone:"indicadores"},
  {href:"/admin/manutencao",texto:"Manutenção",icone:"manutencao"},
];
function observar(callback:()=>void) {
  window.addEventListener("storage",callback); window.addEventListener(EVENTO,callback);
  return ()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENTO,callback);};
}
function leituraSidebar(){return lerPreferencia(CHAVE)==="1";}
function estadoServidor(){return false;}
function atual(path:string, href:string){
  if(href==="/")return path==="/";
  if(href==="/artigos")return path==="/artigos" || path.startsWith("/artigos/");
  if(href==="/categorias")return path==="/categorias" || path.startsWith("/categorias/");
  if(href==="/admin")return path==="/admin";
  return path===href || path.startsWith(href+"/");
}
export function EstruturaAplicacao({nome,papel,children}:{nome:string; papel:Papel; children:ReactNode}) {
  const pathname=usePathname();
  const recolhida=useSyncExternalStore(observar,leituraSidebar,estadoServidor);
  const [mobileAberta,setMobileAberta]=useState(false);
  const menu = useRef<HTMLElement>(null);
  const [contadores,setContadores]=useState<Record<string,number>>({});
  const [dataBase,setDataBase]=useState("");
  useEffect(()=>{
   let ativo=true;
   const controller=new AbortController();
   void fetch("/api/busca/sugestoes",{cache:"no-store",signal:controller.signal}).then(r=>r.ok?r.json():null)
   .then((d:{categorias?:{slug:string;quantidade:number}[];atualizadoEm?:string}|null)=>{
    if(!ativo||!d)return;
    setContadores(Object.fromEntries((d.categorias??[]).map(c=>[c.slug,c.quantidade])));
    if(d.atualizadoEm)setDataBase(d.atualizadoEm);
   }).catch(()=>{});
   return()=>{ativo=false;controller.abort();};
  },[]);
  useEffect(()=>{
    if(!mobileAberta)return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focaveis = () => Array.from(menu.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? [])
      .filter(elemento => elemento.getClientRects().length > 0);
    focaveis()[0]?.focus();
    function tecla(e:KeyboardEvent){
      if(e.key==="Escape")setMobileAberta(false);
      if(e.key === "Tab") {
        const itens = focaveis();
        const primeiro = itens[0], ultimo = itens.at(-1);
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo?.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro?.focus(); }
      }
    }
    const desktop = window.matchMedia("(min-width: 1001px)");
    const redimensionar = () => { if (desktop.matches) setMobileAberta(false); };
    desktop.addEventListener("change", redimensionar);
    window.addEventListener("keydown",tecla);
    return ()=>{
      window.removeEventListener("keydown",tecla);
      desktop.removeEventListener("change", redimensionar);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  },[mobileAberta]);
  function alternar(){salvarPreferencia(CHAVE,recolhida?"0":"1");window.dispatchEvent(new Event(EVENTO));}
  function linkItem(d:Destino) {
    const ativo=atual(pathname,d.href);
    return <Link key={d.href} href={d.href} title={recolhida?d.texto:undefined} aria-current={ativo?"page":undefined} onClick={()=>setMobileAberta(false)} className={`item-navegacao ${ativo?"item-navegacao-ativo":""}`}>
      <IconeInterface nome={d.icone} className="icone-navegacao"/>
      <span className="texto-navegacao">{d.texto}</span>
      {d.href.startsWith("/categorias/")&&contadores[d.href.slice(12)]!==undefined&&<span className="contador-navegacao" aria-label={contadores[d.href.slice(12)]+" artigos"}>{contadores[d.href.slice(12)]}</span>}
    </Link>;
  }
  if(pathname==="/entrar")return <>{children}</>;
  return <div className={`estrutura-app ${pathname==="/chat"?"estrutura-chat":""}`} data-recolhida={recolhida?"sim":"nao"} data-menu-mobile={mobileAberta?"aberto":"fechado"}>
    {mobileAberta&&<button aria-label="Fechar menu de navegação" className="fundo-menu-mobile no-print" onClick={()=>setMobileAberta(false)} type="button"/>}
    <aside ref={menu} className="sidebar-app no-print" id="navegacao-lateral" aria-label="Menu lateral">
      <div className="marca-sidebar">
        <Link href="/" className="marca-nome" onClick={()=>setMobileAberta(false)} aria-label="Início do Nortesys KB"><strong>Nortesys KB</strong></Link>
        <button type="button" className="botao-icone fechar-menu-mobile" onClick={()=>setMobileAberta(false)} aria-label="Fechar menu"><IconeInterface nome="fechar"/></button>
      </div>
      <div className="rolagem-sidebar">
        <nav aria-label="Principal" className="grupo-navegacao"><p className="titulo-navegacao">Principal</p>{principal.map(linkItem)}</nav>
        <nav aria-label="Categorias" className="grupo-navegacao"><div className="titulo-navegacao titulo-navegacao-link"><span>Categorias</span><Link href="/categorias" onClick={()=>setMobileAberta(false)} title="Todas as categorias">Ver todas</Link></div>{destinosCategorias.map(linkItem)}</nav>
        <nav aria-label="Ferramentas" className="grupo-navegacao"><p className="titulo-navegacao">Ferramentas</p>{ferramentas.map(linkItem)}</nav>
        {papel!=="leitor"&&<nav aria-label="Administração" className="grupo-navegacao"><p className="titulo-navegacao">Administração</p>{admin.filter(d=>papel==="administrador"|| !["/admin/usuarios","/admin/auditoria","/admin/indicadores","/admin/manutencao"].includes(d.href)).map(linkItem)}</nav>}
      </div>
      <div className="rodape-sidebar">
        <Link href="/perfil" className="perfil-sidebar no-underline text-[var(--text)]" title={`Abrir perfil de ${nome}`}><div className="avatar-sidebar">{nome.trim().slice(0,1).toUpperCase()}</div><div className="texto-perfil"><strong>{nome}</strong><small>{papel}</small></div></Link>
        <button type="button" className="botao-icone recolher-sidebar" aria-label={recolhida?"Expandir menu lateral":"Recolher menu lateral"} title={recolhida?"Expandir menu":"Recolher menu"} onClick={alternar}><IconeInterface nome={recolhida?"expandir":"recolher"}/></button>
      </div>
    </aside>
    <div className="area-app" inert={mobileAberta}>
      <header className="topbar-app no-print">
        <div className="topbar-esquerda"><button type="button" className="botao-icone abrir-menu-mobile" aria-label="Abrir menu" aria-controls="navegacao-lateral" aria-expanded={mobileAberta} onClick={()=>setMobileAberta(true)}><IconeInterface nome="menu"/></button></div>
        <AtalhoBusca/>
        <div className="topbar-direita"><IndicadorChat/><CentralNotificacoes/><AlternarTema/><MenuConta nome={nome} papel={papel}/></div>
      </header>
      <div className="conteudo-app">{children}</div>
      <footer className="rodape-app no-print"><div className="conteiner"><span>Nortesys KB · v0.8 Preview</span><span>{dataBase?"Base atualizada em "+dataBase.slice(0,10).split("-").reverse().join("/"):"Base de conhecimento interno"}</span></div></footer>
    </div>
  </div>;
}
