"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {CHAT_GERAL_ID,type EstadoChat,type MensagemChat,type UsuarioChat} from "../lib/chat-tipos";
type ErroResposta={erro?:string};
const estiloCampo="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]";
async function jsonSeguro<T,>(res:Response):Promise<T>{
 const dados=await res.json() as T&ErroResposta;
 if(!res.ok)throw new Error(dados.erro||"Requisição indisponível.");
 return dados;
}
async function enviar(acao:string,outros:Record<string,unknown>={}):Promise<Record<string,unknown>>{
 const req=await fetch("/api/chat",{method:"POST",credentials:"same-origin",cache:"no-store",
   headers:{"Content-Type":"application/json"},body:JSON.stringify({acao,...outros})});
 return jsonSeguro<Record<string,unknown>>(req);
}
function horario(valor:string):string {
 const data=new Date(valor);return Number.isNaN(data.getTime())?"":data.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
}
function statusLabel(p:UsuarioChat["presenca"]){return p==="online"?"Online":p==="ausente"?"Ausente":"Offline";}
function selo(p:UsuarioChat["presenca"]){return p==="online"?"🟢":p==="ausente"?"🟡":"⚪";}
function ConteudoMensagem({texto}:{texto:string}){
 const trechos=texto.split(/(https?:\/\/[^\s<>]+|\/artigos\/[a-z0-9-]+\/[a-z0-9-]+)/g);
 return <>{trechos.map((parte,i)=>{
  const link=parte.startsWith("https://")||parte.startsWith("http://")||/^\/artigos\/[a-z0-9-]+\/[a-z0-9-]+$/.test(parte);
  return link?<a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="underline break-all">{parte}</a>:
    <span key={i}>{parte}</span>;
 })}</>;
}
export function ChatPainel({usuarioId}:{usuarioId:string}){
 const [estado,setEstado]=useState<EstadoChat|null>(null);
 const [conversa,setConversa]=useState(CHAT_GERAL_ID);
 const [mensagens,setMensagens]=useState<MensagemChat[]>([]);
 const [texto,setTexto]=useState("");
 const [busca,setBusca]=useState("");
 const [pesquisa,setPesquisa]=useState("");
 const [mais,setMais]=useState(false);
 const [enviando,setEnviando]=useState(false);
 const [aviso,setAviso]=useState("");
 const [notificacao,setNotificacao]=useState("");
 const [digitando,setDigitando]=useState("");
 const [realtime,setRealtime]=useState(false);
 const final=useRef<HTMLDivElement>(null);
 const ultimoEvento=useRef(0);
 const atividade=useRef(Date.now());
 const ultimaDigitacao=useRef(0);
 const selecionada=useRef(conversa);
 const autores=useRef<UsuarioChat[]>([]);
 useEffect(()=>{selecionada.current=conversa;},[conversa]);
 useEffect(()=>{autores.current=estado?.usuarios??[];},[estado]);
 const atualizarEstado=useCallback(async()=>{
  try {
   const resposta=await fetch("/api/chat",{cache:"no-store",credentials:"same-origin"});
   const dados=await jsonSeguro<EstadoChat>(resposta);
   setEstado(dados);
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível atualizar o chat.");}
 },[]);
 const carregar=useCallback(async(id:string,q="",antes:number|null=null)=>{
  const params=new URLSearchParams({conversa:id});
  if(q)params.set("q",q);if(antes!==null)params.set("antes",String(antes));
  try{
   const req=await fetch("/api/chat/mensagens?"+params,{cache:"no-store",credentials:"same-origin"});
   const data=await jsonSeguro<{mensagens:MensagemChat[]}>(req);
   if(selecionada.current!==id)return;
   const lista=data.mensagens;
   setMensagens(atual=>antes===null?lista:[...lista,...atual.filter(m=>!lista.some(a=>a.id===m.id))]);
   setMais(lista.length===60);
   if(!q&&antes===null)void enviar("lido",{conversa:id}).then(()=>atualizarEstado()).catch(()=>{});
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível abrir as mensagens.");}
 },[atualizarEstado]);
 useEffect(()=>{void atualizarEstado();},[atualizarEstado]);
 useEffect(()=>{setMensagens([]);setMais(false);void carregar(conversa,pesquisa);},[conversa,pesquisa,carregar]);
 useEffect(()=>{if(!pesquisa)final.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[mensagens,pesquisa]);
 useEffect(()=>{
  const activity=()=>{atividade.current=Date.now();};
  const visivel=()=>{
   if(!document.hidden){activity();void enviar("presenca",{ativo:true}).catch(()=>{});void atualizarEstado();}
  };
  for(const nome of ["pointerdown","keydown","mousemove","touchstart"])window.addEventListener(nome,activity,{passive:true});
  document.addEventListener("visibilitychange",visivel);
  const batida=()=>{if(!document.hidden)void enviar("presenca",{ativo:Date.now()-atividade.current<300000}).catch(()=>{});};
  batida();const t=window.setInterval(batida,45000);
  return ()=>{window.clearInterval(t);document.removeEventListener("visibilitychange",visivel);
   for(const nome of ["pointerdown","keydown","mousemove","touchstart"])window.removeEventListener(nome,activity);};
 },[atualizarEstado]);
 useEffect(()=>{
  let stream:EventSource|null=null;let encerrado=false;
  const conectar=async()=>{
   stream?.close();stream=null;setRealtime(false);
   try{
    const r=await fetch("/api/chat/token",{cache:"no-store",credentials:"same-origin"});
    const token=await jsonSeguro<{token:string;channels:string[];expires:number}>(r);
    if(encerrado)return;
    const q=new URLSearchParams({channels:token.channels.join(","),v:"1.2",accessToken:token.token});
    stream=new EventSource("https://main.realtime.ably.net/sse?"+q);
    stream.onopen=()=>{setRealtime(true);setAviso(atual=>atual.includes("tempo real")?"":atual);};
    stream.onerror=()=>setRealtime(false);
    stream.onmessage=e=>{
     try{
      const evento=JSON.parse(e.data) as {name?:string;data?:unknown};
      const dados=(typeof evento.data==="string"?JSON.parse(evento.data):evento.data) as Record<string,unknown>|undefined;
      if(!dados||typeof dados.conversaId!=="string")return;
      if(evento.name==="chat_mensagem"){
       if(dados.conversaId===selecionada.current)void carregar(dados.conversaId);
       else {setNotificacao("Nova mensagem em uma de suas conversas");}
       void atualizarEstado();
      }else if(evento.name==="chat_digitando"&&dados.autorId!==usuarioId&&dados.conversaId===selecionada.current){
       const pessoa=autores.current.find(u=>u.id===dados.autorId);
       setDigitando((pessoa?.nome??"Alguém")+" está digitando...");
       ultimoEvento.current=Date.now();
      }
     }catch{/* Eventos malformados são ignorados. */}
    };
   }catch {setRealtime(false);}
  };
  void conectar();
  const renew=window.setInterval(()=>{if(!encerrado)void conectar();},20*60*1000);
  return ()=>{encerrado=true;window.clearInterval(renew);stream?.close();};
 },[atualizarEstado,carregar,usuarioId]);
 useEffect(()=>{
  const t=window.setInterval(()=>{void atualizarEstado();if(!document.hidden)void carregar(selecionada.current,pesquisa);
   if(Date.now()-ultimoEvento.current>5000)setDigitando("");},20000);
  return ()=>window.clearInterval(t);
 },[atualizarEstado,carregar,pesquisa]);
 const abertas=estado?.conversas??[];
 const usuarios=(estado?.usuarios??[]).filter(u=>u.id!==usuarioId);
 const atual=abertas.find(c=>c.id===conversa);
 const totalNaoLidas=abertas.reduce((n,c)=>n+c.naoLidas,0);
 async function abrirPrivada(alvo:string){
  try{
   const resposta=await enviar("privada",{alvo});
   const id=String(resposta.id);
   await atualizarEstado();setPesquisa("");setBusca("");setConversa(id);setNotificacao("");setAviso("");
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível abrir a conversa.");}
 }
 async function enviarTexto(e:FormEvent){
  e.preventDefault();if(enviando||!texto.trim())return;
  setEnviando(true);
  try{
   const resultado=await enviar("enviar",{conversa,texto});
   const mensagem=resultado.mensagem as MensagemChat;
   setMensagens(atual=>atual.some(m=>m.id===mensagem.id)?atual:[...atual,mensagem]);
   setTexto("");setAviso("");void atualizarEstado();
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível enviar a mensagem.");}
  finally{setEnviando(false);}
 }
 function escrever(valor:string){
  setTexto(valor);
  if(valor.trim()&&Date.now()-ultimaDigitacao.current>3500){
   ultimaDigitacao.current=Date.now();void enviar("digitando",{conversa}).catch(()=>{});
  }
 }
 function mudarConversa(id:string){setConversa(id);setPesquisa("");setBusca("");setNotificacao("");setDigitando("");}
 return <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
  <aside className="cartao grid content-start gap-4 p-4" aria-label="Conversas e colaboradores">
   <div><h2 className="text-lg font-bold">Conversas</h2>
    <p className="mt-1 text-xs text-[var(--muted)]">{realtime?"● Tempo real conectado":"○ Atualizações periódicas"} · {totalNaoLidas} não lida(s)</p>
   </div>
   {!estado?<p className="text-sm text-[var(--muted)]">Carregando conversas...</p>:
   <div className="grid gap-1" role="group" aria-label="Selecionar conversa">
    {abertas.map(c=><button type="button" key={c.id} onClick={()=>mudarConversa(c.id)}
      className={"flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm "+(c.id===conversa?"border-[var(--primary)]":"border-[var(--border)]")}>
      <span className="min-w-0"><strong className="block truncate">{c.nome}</strong>
       <span className="block truncate text-xs text-[var(--muted)]">{c.ultimaMensagem?.slice(0,65)||"Sem mensagens"}</span>
      </span>{c.naoLidas>0&&<span className="etiqueta" aria-label={c.naoLidas+" mensagens não lidas"}>{c.naoLidas}</span>}
    </button>)}
   </div>}
   <div className="border-t border-[var(--border)] pt-4">
    <h3 className="mb-2 font-bold">Colaboradores</h3>
    <div className="grid gap-1">{usuarios.map(u=><button type="button" key={u.id} onClick={()=>void abrirPrivada(u.id)}
     className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--surface-alt)]"
     title={"Iniciar conversa privada com "+u.nome}>
     <span aria-hidden="true">{selo(u.presenca)}</span><span className="min-w-0 flex-1 truncate">{u.nome}</span>
     <span className="text-[10px] text-[var(--muted)]">{statusLabel(u.presenca)}</span>
    </button>)}</div>
   </div>
  </aside>
  <section className="cartao flex min-h-[600px] min-w-0 flex-col p-4 sm:p-6" aria-label="Mensagens">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
      <div><h2 className="text-lg font-bold">{atual?.nome??"Equipe — Geral"}</h2>
       <p className="text-xs text-[var(--muted)]">{atual?.tipo==="privada"?"Conversa privada":"Canal geral da equipe"}</p>
      </div>
      <form className="flex flex-wrap items-center gap-2" onSubmit={e=>{e.preventDefault();setPesquisa(busca.trim().slice(0,100));}}>
       <input className={estiloCampo+" max-w-[170px]"} type="search" value={busca} onChange={e=>setBusca(e.target.value)}
        placeholder="Buscar mensagens" aria-label="Pesquisar mensagens" maxLength={100}/>
       <button className="botao-secundario" type="submit">Buscar</button>
       {pesquisa&&<button className="botao-secundario" type="button" onClick={()=>{setBusca("");setPesquisa("");}}>Limpar</button>}
      </form>
    </div>
    {aviso&&<p className="mt-3 text-sm text-amber-700" role="alert">{aviso}</p>}
    {notificacao&&<button type="button" className="mt-3 rounded-lg border border-[var(--border)] p-2 text-left text-sm" onClick={()=>{setNotificacao("");void atualizarEstado();}}>{notificacao} · Ver conversas</button>}
    <div className="min-h-0 flex-1 overflow-y-auto py-5" aria-label="Histórico de mensagens" style={{maxHeight:"55vh"}}>
     {mais&&<button type="button" className="botao-secundario mb-4" onClick={()=>void carregar(conversa,pesquisa,mensagens[0]?.id??null)}>Carregar mensagens anteriores</button>}
     {mensagens.length===0?<p className="py-10 text-center text-sm text-[var(--muted)]">{pesquisa?"Nenhuma mensagem encontrada.":"Nenhuma mensagem ainda. Envie a primeira!"}</p>:
      <ul className="grid gap-3">{mensagens.map(m=><li key={m.id} className={"flex "+(m.autorId===usuarioId?"justify-end":"justify-start")}>
       <article className={"max-w-[93%] rounded-xl border border-[var(--border)] p-3 sm:max-w-[82%] "+(m.autorId===usuarioId?"bg-[var(--surface-alt)]":"bg-[var(--surface)]")}>
        <div className="mb-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
         <strong>{m.autorId===usuarioId?"Você":m.autor}</strong><time dateTime={m.criadoEm}>{horario(m.criadoEm)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6"><ConteudoMensagem texto={m.texto}/></p>
       </article>
      </li>)}</ul>}
     <div ref={final}/>
    </div>
    <div className="border-t border-[var(--border)] pt-3">
     <p className="mb-2 min-h-4 text-xs text-[var(--muted)]" aria-live="polite">{digitando}</p>
     <form onSubmit={e=>void enviarTexto(e)} className="flex items-end gap-2">
      <textarea className={estiloCampo+" min-h-12 flex-1 resize-y"} value={texto} onChange={e=>escrever(e.target.value)}
       onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void enviarTexto(e as unknown as FormEvent);}}}
       rows={2} maxLength={2000} placeholder="Digite sua mensagem... (Enter para enviar)" aria-label="Nova mensagem"
       disabled={enviando||!estado}/>
      <button className="botao-primario" type="submit" disabled={enviando||!texto.trim()}>Enviar</button>
     </form>
     <p className="mt-2 text-xs text-[var(--muted)]">Shift+Enter pula linha. Evite dados confidenciais de clientes. <Link href="/artigos">Compartilhe links de artigos do KB</Link>.</p>
    </div>
  </section>
 </div>;
}
