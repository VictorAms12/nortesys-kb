"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { AlternarTema } from "./alternar-tema";
import { AtalhoBusca } from "./atalho-busca";
import { IconeInterface, type NomeIcone } from "./icone-interface";

type Papel = "administrador" | "editor" | "leitor";
type Destino = {href:string; texto:string; icone:NomeIcone; prefixo?:boolean; titulo?:string};
const CHAVE = "nortesys-kb-sidebar-recolhida";
const EVENTO = "nortesys-kb-sidebar-alterada";
const gerais:Destino[] = [
  {href:"/", texto:"Início", icone:"inicio"},
  {href:"/busca", texto:"Pesquisar", icone:"busca"},
  {href:"/artigos", texto:"Artigos", icone:"livro"},
  {href:"/categorias", texto:"Categorias", icone:"categorias"},
];
const admin:Destino[] = [
  {href:"/admin",texto:"Visão geral",icone:"painel"},
  {href:"/admin/artigos",texto:"Gerenciar artigos",icone:"artigos"},
  {href:"/admin/usuarios",texto:"Usuários",icone:"usuarios"},
  {href:"/admin/auditoria",texto:"Auditoria",icone:"auditoria"},
];
function observar(callback:()=>void) {
  window.addEventListener("storage",callback); window.addEventListener(EVENTO,callback);
  return ()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENTO,callback);};
}
function leituraSidebar(){return window.localStorage.getItem(CHAVE)==="1";}
function estadoServidor(){return false;}
function atual(path:string, href:string){
  if(href==="/")return path==="/";
  if(href==="/artigos")return path==="/artigos" || path.startsWith("/artigos/");
  if(href==="/categorias")return path==="/categorias" || path.startsWith("/categorias/");
  if(href==="/admin")return path==="/admin";
  return path===href || path.startsWith(href+"/");
}
function tituloPagina(path:string):string {
  if(path==="/")return "Início";
  if(path.startsWith("/admin/artigos/"))return "Editor de artigos";
  if(path.startsWith("/artigos/"))return "Leitura de artigo";
  if(path.startsWith("/categorias/"))return "Artigos por categoria";
  return [...gerais,...admin].find(i=>i.href===path)?.texto || "Base de conhecimento";
}
export function EstruturaAplicacao({nome,papel,children}:{nome:string; papel:Papel; children:ReactNode}) {
  const pathname=usePathname();
  const recolhida=useSyncExternalStore(observar,leituraSidebar,estadoServidor);
  const [mobileAberta,setMobileAberta]=useState(false);
  useEffect(()=>{
    if(!mobileAberta)return;
    function tecla(e:KeyboardEvent){if(e.key==="Escape")setMobileAberta(false);}
    window.addEventListener("keydown",tecla);
    return ()=>window.removeEventListener("keydown",tecla);
  },[mobileAberta]);
  function alternar(){window.localStorage.setItem(CHAVE,recolhida?"0":"1");window.dispatchEvent(new Event(EVENTO));}
  function linkItem(d:Destino) {
    const ativo=atual(pathname,d.href);
    return <Link key={d.href} href={d.href} title={recolhida?d.texto:undefined} aria-current={ativo?"page":undefined} onClick={()=>setMobileAberta(false)} className={`item-navegacao ${ativo?"item-navegacao-ativo":""}`}>
      <IconeInterface nome={d.icone} className="icone-navegacao"/>
      <span className="texto-navegacao">{d.texto}</span>
    </Link>;
  }
  if(pathname==="/entrar")return <>{children}</>;
  return <div className="estrutura-app" data-recolhida={recolhida?"sim":"nao"} data-menu-mobile={mobileAberta?"aberto":"fechado"}>
    {mobileAberta&&<button aria-label="Fechar menu de navegação" className="fundo-menu-mobile no-print" onClick={()=>setMobileAberta(false)} type="button"/>}
    <aside className="sidebar-app no-print" id="navegacao-lateral" aria-label="Menu lateral">
      <div className="marca-sidebar">
        <Link href="/" className="simbolo-marca" onClick={()=>setMobileAberta(false)} aria-label="Ir para o início">N</Link>
        <Link href="/" className="texto-marca" onClick={()=>setMobileAberta(false)}><strong>Nortesys KB</strong><small>Base de conhecimento</small></Link>
        <button type="button" className="botao-icone fechar-menu-mobile" onClick={()=>setMobileAberta(false)} aria-label="Fechar menu"><IconeInterface nome="fechar"/></button>
      </div>
      <div className="rolagem-sidebar">
        <nav aria-label="Conhecimento" className="grupo-navegacao"><p className="titulo-navegacao">CONHECIMENTO</p>{gerais.map(linkItem)}</nav>
        {papel!=="leitor"&&<nav aria-label="Administração" className="grupo-navegacao"><p className="titulo-navegacao">ADMINISTRAÇÃO</p>{admin.filter(d=>papel==="administrador"|| !["/admin/usuarios","/admin/auditoria"].includes(d.href)).map(linkItem)}</nav>}
      </div>
      <div className="rodape-sidebar">
        <div className="perfil-sidebar" title={`${nome} · ${papel}`}><div className="avatar-sidebar">{nome.trim().slice(0,1).toUpperCase()}</div><div className="texto-perfil"><strong>{nome}</strong><small>{papel}</small></div></div>
        <button type="button" className="botao-icone recolher-sidebar" aria-label={recolhida?"Expandir menu lateral":"Recolher menu lateral"} title={recolhida?"Expandir menu":"Recolher menu"} onClick={alternar}><IconeInterface nome={recolhida?"expandir":"recolher"}/></button>
      </div>
    </aside>
    <div className="area-app">
      <header className="topbar-app no-print">
        <div className="topbar-esquerda"><button type="button" className="botao-icone abrir-menu-mobile" aria-label="Abrir menu" aria-controls="navegacao-lateral" aria-expanded={mobileAberta} onClick={()=>setMobileAberta(true)}><IconeInterface nome="menu"/></button><span className="caminho-topbar">Nortesys KB <span aria-hidden="true">/</span> <strong>{tituloPagina(pathname)}</strong></span></div>
        <div className="topbar-direita"><AtalhoBusca/><AlternarTema/><form action="/api/autenticacao/sair" method="post"><button type="submit" className="botao-icone" title="Encerrar sessão" aria-label="Sair da conta"><IconeInterface nome="sair"/></button></form></div>
      </header>
      <div className="conteudo-app">{children}</div>
      <footer className="rodape-app no-print"><div className="conteiner">Nortesys KB · Ambiente interno · Acesso restrito</div></footer>
    </div>
  </div>;
}
