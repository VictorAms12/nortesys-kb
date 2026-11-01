"use client";
import {useEffect,useState} from "react";
export function SumarioArtigo({secoes}:{secoes:string[]}){
 const [ativo,setAtivo]=useState(0);
 useEffect(()=>{
  const elementos=secoes.map((_,i)=>document.getElementById("secao-"+(i+1))).filter((x):x is HTMLElement=>Boolean(x));
  if(!elementos.length)return;
  const observer=new IntersectionObserver(entradas=>{
   const naTela=entradas.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
   if(naTela[0]){const id=Number(naTela[0].target.id.replace("secao-",""))-1;setAtivo(id);}
  },{rootMargin:"-80px 0px -60% 0px",threshold:0});
  elementos.forEach(e=>observer.observe(e));return()=>observer.disconnect();
 },[secoes.length]);
 return <aside className="sumario-lateral no-print" aria-label="Nesta página">
  <h2>Nesta página</h2>
  <nav><ol>{secoes.map((titulo,i)=><li key={i}>
   <a href={"#secao-"+(i+1)} className={"link-sumario "+(ativo===i?"ativo":"")}
    aria-current={ativo===i?"location":undefined} onClick={()=>setAtivo(i)}>{titulo}</a>
  </li>)}</ol></nav>
 </aside>;
}
