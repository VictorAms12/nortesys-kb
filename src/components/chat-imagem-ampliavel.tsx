"use client";
import {useState,useRef} from "react";
import {createPortal} from "react-dom";
import Image from "next/image";
export function ImagemChatAmpliavel({id,autor}:{id:number;autor:string}){
 const [aberta,setAberta]=useState(false);
 const modal=useRef<HTMLDialogElement|null>(null);
 const src="/api/chat/imagens/"+id;
 return <>
  <button type="button" className="mb-2 block max-w-full overflow-hidden rounded-lg"
   onClick={()=>setAberta(true)} title="Ampliar imagem" aria-label={"Ampliar imagem de "+autor}>
   <Image src={src} alt={"Imagem enviada por "+autor} width={800} height={600}
    unoptimized className="h-auto max-h-64 w-auto max-w-full rounded-lg object-contain"/>
  </button>
  {aberta&&createPortal(<dialog ref={el=>{modal.current=el;if(el&&!el.open)el.showModal();}}
   aria-label={"Imagem ampliada de "+autor} className="modal-imagem no-print"
   onClose={()=>setAberta(false)} onClick={e=>{if(e.target===e.currentTarget)modal.current?.close();}}>
    <button type="button" className="fechar-imagem" onClick={()=>modal.current?.close()}
     aria-label="Fechar visualização ampliada">✕ Fechar</button>
    <Image src={src} alt={"Imagem enviada por "+autor} width={1600} height={1200}
      unoptimized className="h-auto w-auto max-h-[84vh] max-w-[94vw] object-contain"/>
  </dialog>,document.body)}
 </>;
}
