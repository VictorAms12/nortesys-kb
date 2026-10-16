"use client";

import { useEffect, useRef } from "react";

export function AtalhoBusca() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function atalho(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (evento.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", atalho);
    return () => document.removeEventListener("keydown", atalho);
  }, []);

  return (
    <form className="busca-cabecalho" role="search" action="/busca" method="get">
      <label htmlFor="busca-global" className="sr-only">Pesquisar na base de conhecimento</label>
      <span aria-hidden="true" className="icone-busca">⌕</span>
      <input id="busca-global" ref={inputRef} name="q" type="search" placeholder="Pesquisar solução, código de erro..." maxLength={120} autoComplete="off" />
      <kbd className="atalho-teclado" aria-hidden="true">Ctrl K</kbd>
      <button type="submit" aria-label="Executar pesquisa" className="botao-enviar-busca">Buscar</button>
    </form>
  );
}
