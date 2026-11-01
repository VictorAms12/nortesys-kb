"use client";
import {useEffect,useSyncExternalStore} from "react";
import {lerPreferencia,salvarPreferencia} from "../lib/preferencias-navegador";
import {IconeInterface} from "./icone-interface";
type Tema="claro"|"escuro";
const CHAVE="nortesys-kb-tema",EVENTO="nortesys-kb-troca-tema";
function temaSalvo():Tema{return lerPreferencia(CHAVE)==="escuro"?"escuro":"claro";}
function temaServidor():Tema{return "claro";}
function assinarMudancas(ouvinte:()=>void){
 window.addEventListener("storage",ouvinte);window.addEventListener(EVENTO,ouvinte);
 return()=>{window.removeEventListener("storage",ouvinte);window.removeEventListener(EVENTO,ouvinte);};
}
export function AlternarTema(){
 const tema=useSyncExternalStore(assinarMudancas,temaSalvo,temaServidor);
 useEffect(()=>{document.documentElement.setAttribute("data-theme",tema==="escuro"?"dark":"light");},[tema]);
 function alternar(){
  salvarPreferencia(CHAVE,tema==="claro"?"escuro":"claro");
  window.dispatchEvent(new Event(EVENTO));
 }
 return <button type="button" onClick={alternar} className="botao-icone alternar-tema"
  title={tema==="claro"?"Ativar tema escuro":"Ativar tema claro"}
  aria-label={tema==="claro"?"Ativar tema escuro":"Ativar tema claro"}>
  <IconeInterface nome={tema==="claro"?"sol":"lua"} width={18} height={18}/>
 </button>;
}
