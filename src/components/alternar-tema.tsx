"use client";

import { useEffect, useSyncExternalStore } from "react";
import { lerPreferencia, salvarPreferencia } from "../lib/preferencias-navegador";
import {IconeInterface} from "./icone-interface";

type Tema = "sistema" | "claro" | "escuro";
const CHAVE = "nortesys-kb-tema";
const EVENTO = "nortesys-kb-troca-tema";

function temaSalvo(): Tema {
  const salvo = lerPreferencia(CHAVE);
  return salvo === "claro" || salvo === "escuro" ? salvo : "sistema";
}
function temaServidor(): Tema { return "sistema"; }
function assinarMudancas(ouvinte: () => void) {
  window.addEventListener("storage", ouvinte);
  window.addEventListener(EVENTO, ouvinte);
  return () => {
    window.removeEventListener("storage", ouvinte);
    window.removeEventListener(EVENTO, ouvinte);
  };
}
function aplicarTema(tema: Tema) {
  if (tema === "sistema") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
}

export function AlternarTema() {
  // useSyncExternalStore evita diferenças de HTML entre a renderização no servidor e no cliente.
  const tema = useSyncExternalStore(assinarMudancas, temaSalvo, temaServidor);
  useEffect(() => { aplicarTema(tema); }, [tema]);

  function mudarTema() {
    const proximo: Tema = tema === "sistema" ? "claro" : tema === "claro" ? "escuro" : "sistema";
    salvarPreferencia(CHAVE, proximo);
    window.dispatchEvent(new Event(EVENTO));
  }
  return (
    <button type="button" onClick={mudarTema}
      className="botao-secundario whitespace-nowrap"
      title="Alternar entre tema do sistema, claro e escuro"
      aria-label={`Tema atual: ${tema}. Alterar tema`}>
      <IconeInterface nome={tema==="claro"?"sol":tema==="escuro"?"lua":"monitor"}/>
      <span className="hidden sm:inline">{tema === "sistema" ? "Sistema" : tema === "claro" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
