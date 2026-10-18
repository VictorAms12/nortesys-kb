"use client";
import { useEffect, useState } from "react";
export function InteracoesArtigo({url,favoritoInicial}:{url:string;favoritoInicial:boolean}){
  const [favorito,setFavorito]=useState(favoritoInicial);
  const [ocupado,setOcupado]=useState(false);
  const [erro,setErro]=useState("");
  useEffect(()=>{
    const body=new URLSearchParams({acao:"visita",artigo_url:url});
    void fetch("/api/interacoes",{method:"POST",body,credentials:"same-origin"}).catch(()=>{});
  },[url]);
  async function alternar(){
    setOcupado(true);setErro("");
    try{
      const body=new URLSearchParams({acao:favorito?"desfavoritar":"favoritar",artigo_url:url});
      const resposta=await fetch("/api/interacoes",{method:"POST",body,credentials:"same-origin"});
      if(!resposta.ok)throw Error("Falha");
      setFavorito(!favorito);
    }catch{setErro("Não foi possível atualizar os favoritos.");}finally{setOcupado(false);}
  }
  return <div className="no-print flex flex-wrap items-center gap-3">
    <button type="button" className="botao-secundario" onClick={alternar} disabled={ocupado} aria-busy={ocupado} aria-pressed={favorito}>{ocupado && <span className="indicador-envio" aria-hidden="true"/>}{favorito?"★ Remover dos favoritos":"☆ Adicionar aos favoritos"}</button>
    {erro&&<span role="alert" className="text-sm text-[var(--warn-text)]">{erro}</span>}
  </div>;
}
