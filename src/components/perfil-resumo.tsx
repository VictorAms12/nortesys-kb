"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
type Perfil={id:string;avatarCaminho?:string|null;nome:string;usuario:string;papel:string;bio?:string|null;preferencias?:{avisos:boolean;navegador:boolean;geral:boolean}};
export function PerfilResumo(){
 const [perfil,setPerfil]=useState<Perfil|null>(null);
 const [erro,setErro]=useState("");
 const [salvando,setSalvando]=useState(false);
 const [enviandoFoto,setEnviandoFoto]=useState(false);
 const fotoEmEnvio=useRef(false);
 const [imagemFalhou,setImagemFalhou]=useState(false);
 const [tentativa,setTentativa]=useState(0);
 const [chavePush,setChavePush]=useState<string|null>(null);
 useEffect(()=>{
  let ativo=true;
  void fetch("/api/notificacoes/push",{cache:"no-store"})
   .then(r=>r.ok?r.json():null)
   .then((v:{publicKey?:string|null}|null)=>{if(ativo)setChavePush(v?.publicKey??null);})
   .catch(()=>{if(ativo)setChavePush(null);});
  return()=>{ativo=false;};
 },[]);
 useEffect(()=>{void fetch("/api/perfil",{cache:"no-store"}).then(r=>{if(r.status===401){window.location.replace("/entrar");throw Error("Sessão expirada");}if(!r.ok)throw Error();return r.json();}).then(setPerfil).catch(()=>setErro("Não foi possível consultar seu perfil."));},[tentativa]);
 async function habilitarWebPush(){
  if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window)){
   setErro("Este navegador não oferece Web Push.");return;
  }
  if(!chavePush){setErro("Web Push não está configurado neste ambiente.");return;}
  try{
   // A permissão ocorre diretamente no clique, exigência de navegadores móveis.
   const permissao=await Notification.requestPermission();
   if(permissao!=="granted"){setErro("Permissão não concedida.");return;}
   const reg=await navigator.serviceWorker.register("/kb-notification-worker.js",{scope:"/"});
   const base64=chavePush.replace(/-/g,"+").replace(/_/g,"/");
   const bytes=Uint8Array.from(atob(base64+"=".repeat((4-base64.length%4)%4)),c=>c.charCodeAt(0));
   let inscricao=await reg.pushManager.getSubscription();
   if(inscricao){
    const antiga=inscricao.options.applicationServerKey;
    const mesma=antiga&&new Uint8Array(antiga).length===bytes.length&&
     [...new Uint8Array(antiga)].every((valor,indice)=>valor===bytes[indice]);
    if(!mesma){await inscricao.unsubscribe();inscricao=null;}
   }
   if(!inscricao)inscricao=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
   const resposta=await fetch("/api/notificacoes/push",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({endpoint:inscricao.endpoint}),credentials:"same-origin"});
   if(!resposta.ok)throw Error("Cadastro do dispositivo não aceito");
   setPerfil(d=>d?{...d,preferencias:{avisos:true,geral:true,...d.preferencias,navegador:true}}:d);
   setErro("Dispositivo registrado. Salve as preferências para ativar os avisos.");
  }catch{
   setErro("Não foi possível ativar Web Push. Confira as permissões e a conexão.");
  }
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
   setPerfil(atual=>atual?{...atual,preferencias:{avisos:true,geral:true,...atual.preferencias,navegador:false}}:atual);
   setErro("Dispositivo desvinculado. Salve as preferências para desativar em todos os aparelhos.");
  }catch{setErro("Não foi possível remover este dispositivo.");}
 }
 async function enviarFoto(arquivo:File){
  if(fotoEmEnvio.current)return;
  if(arquivo.size===0||arquivo.size>2097152||!["image/png","image/jpeg","image/webp"].includes(arquivo.type)){setErro("Imagem inválida; use PNG, JPEG ou WebP com até 2 MB.");return;}
  fotoEmEnvio.current=true;setEnviandoFoto(true);
  const dados=new FormData();dados.set("imagem",arquivo);
  setErro("Enviando imagem...");
  try{
   const r=await fetch("/api/perfil/avatar",{method:"POST",body:dados});
   if(!r.ok)throw Error();
   const p=await fetch("/api/perfil",{cache:"no-store"}).then(x=>x.json());
   setPerfil(atual=>atual?{...atual,avatarCaminho:p.avatarCaminho}:{...p,bio:p.bio??""});
   setImagemFalhou(false);
   window.dispatchEvent(new Event("kb-perfil-atualizado"));
   if(typeof BroadcastChannel!=="undefined"){
    const canal=new BroadcastChannel("kb-perfil-atualizado");canal.postMessage("avatar");canal.close();
   }
   setErro("Imagem atualizada.");
  }catch{setErro("Falha ao enviar imagem.");}
  finally{fotoEmEnvio.current=false;setEnviandoFoto(false);}
 }
 async function salvar(){if(!perfil||salvando)return;setSalvando(true);setErro("");try{const r=await fetch("/api/perfil",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bio:perfil.bio??"",preferencias:perfil.preferencias??{avisos:true,navegador:false,geral:true}})});if(!r.ok)throw Error();
  const prefs=perfil.preferencias??{avisos:true,navegador:false,geral:true};
  window.dispatchEvent(new CustomEvent("kb-preferencias-atualizadas",{detail:prefs}));
  if(typeof BroadcastChannel!=="undefined"){
   const canal=new BroadcastChannel("kb-notificacoes-atualizadas");
   canal.postMessage({tipo:"preferencias",preferencias:prefs});canal.close();
  }
  setErro("Preferências salvas.");}catch{setErro("Não foi possível salvar.");}finally{setSalvando(false);}}
 if(erro&&!perfil)return <div className="cartao mt-6 flex flex-wrap items-center gap-3 p-5" role="alert">
  <p>{erro}</p>
  <button type="button" className="botao-secundario" onClick={()=>{setErro("");setTentativa(n=>n+1);}}>Tentar novamente</button>
 </div>;
 if(!perfil)return <div className="cartao p-5 mt-6" role="status">Carregando perfil...</div>;
 return <section className="cartao mt-6 max-w-2xl space-y-5 p-6"><div className="flex items-center gap-4"><div className="avatar-sidebar !h-16 !w-16 overflow-hidden text-2xl">{perfil.avatarCaminho&&!imagemFalhou?<Image src={"/api/perfil/avatar/"+perfil.id+"?v="+encodeURIComponent(perfil.avatarCaminho?.split("/").at(-1)??"0")} width={64} height={64} alt="Avatar" unoptimized onError={()=>setImagemFalhou(true)} className="h-full w-full object-cover"/>:perfil.nome[0]?.toUpperCase()}</div><div><h2 className="text-xl font-bold">{perfil.nome}</h2><p className="text-sm text-[var(--muted)]">@{perfil.usuario} · {perfil.papel}</p></div></div><label className="grid gap-2 text-sm">Foto (PNG, JPEG ou WebP, 2 MB){enviandoFoto&&<span role="status">Enviando foto...</span>}<input type="file" disabled={enviandoFoto} accept="image/png,image/jpeg,image/webp" onChange={e=>{const a=e.target.files?.[0];if(a)void enviarFoto(a);}}/></label><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Apresentação</h3><textarea className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm" aria-label="Descrição profissional" rows={4} maxLength={240} value={perfil.bio??""} onChange={e=>setPerfil({...perfil,bio:e.target.value})}/></div><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Notificações</h3><div className="mt-3 grid gap-3">{(["avisos","geral","navegador"] as const).map(k=><label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(perfil.preferencias?.[k])} onChange={e=>setPerfil({...perfil,preferencias:{avisos:true,geral:true,navegador:false,...perfil.preferencias,[k]:e.target.checked}})}/>{k==="avisos"?"Avisos no site":k==="geral"?"Mensagens do canal geral":"Notificações do navegador"}</label>)}<div className="flex flex-wrap gap-2"><button type="button" className="botao-secundario" onClick={()=>void habilitarWebPush()} disabled={!chavePush} title={chavePush?undefined:"Web Push indisponível neste ambiente"}>Ativar neste dispositivo</button><button type="button" className="botao-secundario" onClick={()=>void desativarWebPush()}>Desativar neste dispositivo</button></div></div></div><div className="flex flex-wrap items-center gap-3"><button type="button" className="botao-primario" disabled={salvando} onClick={()=>void salvar()}>{salvando?"Salvando...":"Salvar preferências"}</button>{erro&&<p role="status" className="text-sm text-[var(--muted)]">{erro}</p>}</div></section>;
}
