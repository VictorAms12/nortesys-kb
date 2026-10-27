"use client";
import {useState} from "react";
export function FeedbackArtigo({url,inicial}:{url:string;inicial:boolean|null}){
 const [resposta,setResposta]=useState<boolean|null>(inicial);
 const [enviando,setEnviando]=useState(false);
 const [erro,setErro]=useState("");
 async function votar(resolveu:boolean){
  if(enviando)return;
  setEnviando(true);setErro("");
  try{
   const res=await fetch("/api/artigos/feedback",{method:"POST",credentials:"same-origin",
    cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({url,resolveu})});
   if(!res.ok)throw Error("Não foi possível registrar sua avaliação.");
   setResposta(resolveu);
  }catch{setErro("Não foi possível salvar. Tente novamente.");}
  finally{setEnviando(false);}
 }
 return <section className="no-print mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
  aria-labelledby="titulo-feedback">
   <h2 className="text-base font-bold" id="titulo-feedback">Este artigo resolveu seu problema?</h2>
   <p className="mt-1 text-sm text-[var(--muted)]">Sua resposta ajuda a melhorar os procedimentos. Você pode alterá-la depois.</p>
   <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Avaliar utilidade do artigo">
    <button type="button" className={resposta===true?"botao-primario":"botao-secundario"}
      disabled={enviando} aria-pressed={resposta===true} onClick={()=>void votar(true)}>Sim, resolveu</button>
    <button type="button" className={resposta===false?"botao-primario":"botao-secundario"}
      disabled={enviando} aria-pressed={resposta===false} onClick={()=>void votar(false)}>Não resolveu</button>
   </div>
   {resposta!==null&&<p role="status" className="mt-3 text-xs text-[var(--muted)]">Avaliação registrada. Obrigado!</p>}
   {erro&&<p role="alert" className="mt-3 text-sm text-[var(--warn-text)]">{erro}</p>}
 </section>;
}
