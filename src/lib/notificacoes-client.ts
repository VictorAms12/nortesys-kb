/** Dedupe de alertas entre abas do mesmo navegador, sem armazenar conteúdo privado. */
export function maisRecente(id:string,anterior:string):boolean{
 return id.length>anterior.length||(id.length===anterior.length&&id>anterior);
}
export async function reservarAlerta(id:string,usuario:string):Promise<boolean>{
 if(!/^[1-9][0-9]{0,17}$/.test(id))return false;
 const chave="kb-ultimo-alerta:"+usuario;
 const reservar=()=>{
  try{
   const anterior=window.localStorage.getItem(chave)??"0";
   if(!maisRecente(id,anterior))return false;
   window.localStorage.setItem(chave,id);
   return true;
  }catch{return true;}
 };
 try{
  if(navigator.locks)
   return await navigator.locks.request("kb-alerta:"+usuario,{mode:"exclusive"},reservar);
 }catch{/* Alguns navegadores não permitem locks ou armazenamento. */}
 return reservar();
}
