"use client";
import {useEffect,useState} from "react";
type Perfil={nome:string;usuario:string;papel:string;bio?:string|null;preferencias?:{avisos:boolean;navegador:boolean;geral:boolean}};
export function PerfilResumo(){
 const [perfil,setPerfil]=useState<Perfil|null>(null);
 const [erro,setErro]=useState("");
 useEffect(()=>{void fetch("/api/perfil",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setPerfil).catch(()=>setErro("Não foi possível consultar seu perfil."));},[]);
 if(erro)return <div className="cartao p-5 mt-6" role="alert">{erro}</div>;
 if(!perfil)return <div className="cartao p-5 mt-6" role="status">Carregando perfil...</div>;
 return <section className="cartao mt-6 max-w-2xl space-y-5 p-6"><div className="flex items-center gap-4"><div className="avatar-sidebar !h-16 !w-16 text-2xl">{perfil.nome[0]?.toUpperCase()}</div><div><h2 className="text-xl font-bold">{perfil.nome}</h2><p className="text-sm text-[var(--muted)]">@{perfil.usuario} · {perfil.papel}</p></div></div><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Apresentação</h3><p className="mt-2 text-sm text-[var(--muted)]">{perfil.bio||"Nenhuma apresentação cadastrada."}</p></div><div className="border-t border-[var(--border)] pt-4"><h3 className="font-semibold">Notificações</h3><p className="mt-2 text-sm text-[var(--muted)]">{perfil.preferencias?.avisos?"Avisos internos habilitados":"Avisos internos desabilitados"}</p></div></section>;
}
