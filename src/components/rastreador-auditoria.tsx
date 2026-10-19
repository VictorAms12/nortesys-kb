"use client";
import {useEffect} from "react";
import type {EventoCliente} from "../lib/auditoria-eventos-tipos";
export function RastreadorAuditoria({evento,alvo}:{evento:EventoCliente;alvo?:string}){
 useEffect(()=>{
   void fetch("/api/auditoria/acao",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({evento,alvo}),credentials:"same-origin",cache:"no-store"}).catch(()=>{});
 },[evento,alvo]);
 return null;
}
