"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
type Perfil={id:string;avatarCaminho?:string|null;nome:string;usuario:string;papel:string;bio?:string|null;preferencias?:{avisos:boolean;navegador:boolean;geral:boolean}};
export function PerfilResumo(){
 const [perfil,setPerfil]=useState<Perfil|null>(null);
 const [erro,setErro]=useState("");
 const [salvando,setSalvando]=useState(false);
 useEffect(()=>{void fetch("/api/perfil",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setPerfil).catch(()=>setErro("Não foi possível consultar seu perfil."));},[]);
 async function habilitarWebPush(){
  if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window)){
   setErro("Este navegador não oferece Web Push.");return;
  }
  try{
   const chave=await fetch("/api/notificacoes/push",{cache:"no-store"}).then(r=>r.json()) as {publicKey?:string;configurado:boolean};
   if(!chave.configurado||!chave.publicKey){setErro("Web Push ainda não configurado neste ambiente.");return;}
   const permissao=await Notification.requestPermission();
   if(permissao!=="granted"){setErro("Permissão não concedida.");return;}
   const reg=await navigator.serviceWorker.register("/kb-notification-worker.js",{scope:"/"});
   const bytes=Uint8Array.from(atob(chave.publicKey.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
   const subscricao=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
   const r=await fetch("/api/notificacoes/push",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({endpoint:subscricao.endpoint})});
   if(!r.ok)throw Error();
   setPerfil(d=>d?{...d,preferencias:{avisos:true,geral:true,...d.preferencias,navegador:true}}:d);
   setErro("Dispositivo registrado. Salve as preferências para ativar os avisos.");
  }catch{setErro("Não foi possível ativar as notificações neste dispositivo.");}
 }
 async function desativarWebPush(){
  if(!("serviceWorker" in navigator)){setErro("Web Push não está disponível.");return;}
  try{
   const registro=await navigator.serviceWorker.getRegistration("/kb-notification-worker.js");
   const assinatura=await registro?.pushManager.getSubscription();
   if(assinatura){
    const r=await fetch("/api/notificacoes/push",{method:"DELETE",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({endpoint:assinatura.endpoint})});
    if(!r.ok)throw Error();
    await assinatura.unsubscribe();
   }
   setPerfil(atual=>atual?{...atual,preferencias:{avisos:true,geral:true,navegador:false,...atual.preferencias,navegador:false}}:atual);
   setErro("Dispositivo desvinculado. Salve as preferências para desativar em todos os aparelhos.");
  }catch{setErro("Não foi possível remover este dispositivo.");}
 }
 async function enviarFoto(arquivo:File){
  if(arquivo.size===0||arquivo.size>2097152||!["image/png","image/jpeg","image/webp"].includes(arquivo.type)){setErro("Imagem inválida; use PNG, JPEG ou WebP com até 2 MB.");return;}
  const dados=new FormData();dados.set("imagem",arquivo);
  setErro("Enviando imagem...");
  try{
   const r=await fetch("/api/perfil/avatar",{method:"POST",body:dados});
   if(!r.ok)throw Error();
   const p=await fetch("/api/perfil",{cache:"no-store"}).then(x=>x.json());
   setPerfil(atual=>atual?{...atual,avatarCaminho:p.avatarCaminho}:{...p,bio:p.bio??""});setErro("Imagem atualizada.");
  }catch{setErro("Falha ao enviar imagem.");}
 }
 async function salvar(){if(!perfil||salvando)return;setSalvando(true);setErro("");try{const r=await fetch("/api/perfil",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bio:perfil.bio??"",preferencias:perfil.preferencias??{avisos:true,navegador:false,geral:true}})});if(!r.ok)throw Error();setErro("Preferências salvas.");}catch{setErro("Não foi possível salvar.");}finally{setSalvando(false);}}
 if(erro&&!perfil)return <div className="cartao p-5 mt-6" role="alert">{erro}</div>;
 if(!perfil)return <div className="cartao p-5 mt-6" role="status">Carregando perfil...</div>;
 return <section className="cartao mt-6 max-w-2xl space-y-5 p-6"><div className="flex items-center gap-4"><div className="avatar-sidebar !h-16 !w-16 overflow-hidden text-2xl">{perfil.avatarCaminho?<Image src={"/api/perfil/avatar/"+perfil.id+"?v="+encodeURIComponent(perfil.avatarCaminho?.split("/").at(-1)??"0")} width={64} height={64} alt="Avatar" unoptimized className="h-full w-full object-cover"/>:perfil.nome[0]?.toUpperCase()}</div><div><h2 className="text-xl font-bold">{perfil.nome}</h2><p className="text-sm text-[var(--muted)]">@{perfil.usuario} · {perfil.papel}</p></div></div><label className="grid gap-2 text-sm">Foto (PNG, JPEG ou WebP, 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const a=e.target.files?.[0];if(a)void enviarFoto(a);}}/></label><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Apresentação</h3><textarea className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm" aria-label="Descrição profissional" rows={4} maxLength={240} value={perfil.bio??""} onChange={e=>setPerfil({...perfil,bio:e.target.value})}/></div><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Notificações</h3><div className="mt-3 grid gap-3">{(["avisos","geral","navegador"] as const).map(k=><label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(perfil.preferencias?.[k])} onChange={e=>setPerfil({...perfil,preferencias:{avisos:true,geral:true,navegador:false,...perfil.preferencias,[k]:e.target.checked}})}/>{k==="avisos"?"Avisos no site":k==="geral"?"Mensagens do canal geral":"Notificações do navegador"}</label>)}<div className="flex flex-wrap gap-2"><button type="button" className="botao-secundario" onClick={()=>void habilitarWebPush()}>Ativar neste dispositivo</button><button type="button" className="botao-secundario" onClick={()=>void desativarWebPush()}>Desativar neste dispositivo</button></div></div></div><div className="flex flex-wrap items-center gap-3"><button type="button" className="botao-primario" disabled={salvando} onClick={()=>void salvar()}>{salvando?"Salvando...":"Salvar preferências"}</button>{erro&&<p role="status" className="text-sm text-[var(--muted)]">{erro}</p>}</div></section>;
}
