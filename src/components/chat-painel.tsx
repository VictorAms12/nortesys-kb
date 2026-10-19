"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {CHAT_GERAL_ID,type EstadoChat,type MensagemChat,type UsuarioChat,type ReferenciaMensagem} from "../lib/chat-tipos";
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
 const [respondendo,setRespondendo]=useState<MensagemChat|null>(null);
 const [operando,setOperando]=useState<number|null>(null);
 const [limpando,setLimpando]=useState(false);
 const [busca,setBusca]=useState("");
 const [pesquisa,setPesquisa]=useState("");
 const [mais,setMais]=useState(false);
 const [enviando,setEnviando]=useState(false);
 const [aviso,setAviso]=useState("");
 const [notificacao,setNotificacao]=useState("");
 const [digitando,setDigitando]=useState("");
 const [realtime,setRealtime]=useState(false);
 const [contatosAbertos,setContatosAbertos]=useState(false);
 const painelRef=useRef<HTMLDivElement>(null);
 const historicoRef=useRef<HTMLDivElement>(null);
 const rolarAoFim=useRef(true);
 const ajusteHistorico=useRef<{altura:number;topo:number}|null>(null);
 // Tamanho explícito calculado pela posição REAL do chat na janela, incluindo
 // as barras variáveis do navegador, zoom e cabeçalhos que quebram linha.
 // Não depende da altura intrínseca das mensagens nem de flex:1 em ancestrais.
 useEffect(()=>{
  const painel=painelRef.current;
  if(!painel)return;
  let quadro=0;
  const ajustar=()=>{
   window.cancelAnimationFrame(quadro);
   quadro=window.requestAnimationFrame(()=>{
    const vv=window.visualViewport;
    const fundo=vv?vv.offsetTop+vv.height:window.innerHeight;
    const topo=painel.getBoundingClientRect().top;
    const disponivel=Math.floor(fundo-topo-10);
    // Em janelas muito baixas, permitir rolagem da página em vez de esconder
    // o compositor. Em alturas normais, só o histórico recebe scroll.
    if(Number.isFinite(disponivel)&&disponivel>0)
      painel.style.height=`${Math.max(310,disponivel)}px`;
   });
  };
  ajustar();
  const observador=new ResizeObserver(ajustar);
  const barra=document.querySelector(".topbar-app");
  if(barra)observador.observe(barra);
  window.addEventListener("resize",ajustar);
  window.visualViewport?.addEventListener("resize",ajustar);
  window.visualViewport?.addEventListener("scroll",ajustar);
  return ()=>{
   observador.disconnect();
   window.cancelAnimationFrame(quadro);
   window.removeEventListener("resize",ajustar);
   window.visualViewport?.removeEventListener("resize",ajustar);
   window.visualViewport?.removeEventListener("scroll",ajustar);
  };
 },[]);

 const timeoutDigitando=useRef<number|null>(null);
 const atividade=useRef(0);
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
   if(!q&&antes===null&&!document.hidden)void enviar("lido",{conversa:id}).then(()=>atualizarEstado()).catch(()=>{});
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível abrir as mensagens.");}
 },[atualizarEstado]);
 useEffect(()=>{const t=window.setTimeout(()=>void atualizarEstado(),0);return ()=>window.clearTimeout(t);},[atualizarEstado]);
 useEffect(()=>{const t=window.setTimeout(()=>void carregar(conversa,pesquisa),0);return ()=>window.clearTimeout(t);},[conversa,pesquisa,carregar]);
 useEffect(()=>{
  const area=historicoRef.current;
  if(!area||pesquisa||mensagens.length===0)return;
  if(ajusteHistorico.current){
   const anterior=ajusteHistorico.current;
   area.scrollTop=anterior.topo+area.scrollHeight-anterior.altura;
   ajusteHistorico.current=null;
  }else if(rolarAoFim.current||area.scrollHeight-area.scrollTop-area.clientHeight<160){
   area.scrollTop=area.scrollHeight;
  }
  rolarAoFim.current=false;
 },[mensagens,pesquisa]);
 useEffect(()=>{
  const activity=()=>{atividade.current=Date.now();};
  const visivel=()=>{
   if(!document.hidden){activity();void enviar("presenca",{ativo:true}).catch(()=>{});void atualizarEstado();}
  };
  for(const nome of ["pointerdown","keydown","mousemove","touchstart"])window.addEventListener(nome,activity,{passive:true});
  document.addEventListener("visibilitychange",visivel);
  const batida=()=>{if(!document.hidden)void enviar("presenca",{ativo:Date.now()-atividade.current<300000}).catch(()=>{});};
  activity();batida();const t=window.setInterval(batida,45000);
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
      if(evento.name==="chat_mensagem"||evento.name==="chat_alteracao"){
       if(dados.conversaId===selecionada.current)void carregar(dados.conversaId);
       else if(evento.name==="chat_mensagem"){setNotificacao("Nova mensagem em uma de suas conversas");}
       void atualizarEstado();
      }else if(evento.name==="chat_digitando"&&dados.autorId!==usuarioId&&dados.conversaId===selecionada.current){
       const pessoa=autores.current.find(u=>u.id===dados.autorId);
       setDigitando((pessoa?.nome??"Alguém")+" está digitando...");
       if(timeoutDigitando.current!==null)window.clearTimeout(timeoutDigitando.current);
       timeoutDigitando.current=window.setTimeout(()=>setDigitando(""),5000);
      }
     }catch{/* Eventos malformados são ignorados. */}
    };
   }catch {setRealtime(false);}
  };
  void conectar();
  const renew=window.setInterval(()=>{if(!encerrado)void conectar();},20*60*1000);
  return ()=>{encerrado=true;window.clearInterval(renew);stream?.close();
    if(timeoutDigitando.current!==null)window.clearTimeout(timeoutDigitando.current);};
 },[atualizarEstado,carregar,usuarioId]);
 useEffect(()=>{
  const t=window.setInterval(()=>{void atualizarEstado();if(!document.hidden)void carregar(selecionada.current,pesquisa);},20000);
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
   rolarAoFim.current=true;await atualizarEstado();setPesquisa("");setBusca("");setMensagens([]);setMais(false);setRespondendo(null);setConversa(id);setContatosAbertos(false);setNotificacao("");setAviso("");
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível abrir a conversa.");}
 }
 async function enviarTexto(e:FormEvent){
  e.preventDefault();if(enviando||!texto.trim())return;
  setEnviando(true);
  try{
   const respostaPara=respondendo;
   const resultado=await enviar("enviar",{conversa,texto,respondendoA:respostaPara?.id??null});
   const mensagem=resultado.mensagem as MensagemChat;
   const respostaA:ReferenciaMensagem|null=respostaPara?{
     id:respostaPara.id,autor:respostaPara.autor,texto:respostaPara.texto
   }:null;
   setMensagens(atual=>atual.some(m=>m.id===mensagem.id)?atual:[...atual,{...mensagem,respostaA}]);
   setTexto("");setRespondendo(null);setAviso("");void atualizarEstado();
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível enviar a mensagem.");}
  finally{setEnviando(false);}
 }
 function escrever(valor:string){
  setTexto(valor);
  if(valor.trim()&&Date.now()-ultimaDigitacao.current>3500){
   ultimaDigitacao.current=Date.now();void enviar("digitando",{conversa}).catch(()=>{});
  }
 }
 async function apagarMensagem(id:number,paraTodos:boolean){
  if(operando!==null)return;
  if(!window.confirm(paraTodos
    ?"Apagar esta mensagem para todos? O texto será substituído por ‘Mensagem apagada’."
    :"Apagar esta mensagem somente para você? Não será possível recuperá-la."))return;
  setOperando(id);
  try{
    await enviar(paraTodos?"apagar_todos":"apagar_mim",{conversa,mensagemId:id});
    if(respondendo?.id===id)setRespondendo(null);
    setAviso("");
    await Promise.all([carregar(conversa,pesquisa),atualizarEstado()]);
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível apagar a mensagem.");}
  finally{setOperando(null);}
 }
 async function limparConversa(){
  if(limpando)return;
  if(!window.confirm("Limpar esta conversa somente para você? Todas as mensagens anteriores deixarão de aparecer na sua conta. Esta ação não pode ser desfeita."))return;
  setLimpando(true);
  try{
    await enviar("limpar",{conversa});
    setMensagens([]);setMais(false);setRespondendo(null);setAviso("");
    await atualizarEstado();
  }catch(e){setAviso(e instanceof Error?e.message:"Não foi possível limpar a conversa.");}
  finally{setLimpando(false);}
 }
 function mudarConversa(id:string){rolarAoFim.current=true;setMensagens([]);setMais(false);setRespondendo(null);setConversa(id);setPesquisa("");setBusca("");setNotificacao("");setDigitando("");setContatosAbertos(false);}
 return <div ref={painelRef} className="chat-painel grid min-w-0 gap-3 lg:grid-cols-[minmax(0,270px)_minmax(0,1fr)]" data-contatos-abertos={contatosAbertos?"sim":"nao"}>
  {contatosAbertos&&<button type="button" className="chat-fundo-contatos" aria-label="Fechar lista de conversas" onClick={()=>setContatosAbertos(false)}/>}
  <aside className="chat-lista cartao grid min-w-0 content-start gap-4 overflow-y-auto overflow-x-hidden p-3 sm:p-4" aria-label="Conversas e colaboradores">
   <div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-base font-bold">Conversas</h2>
    <p className="mt-1 text-xs text-[var(--muted)]">{realtime?"● Tempo real conectado":"○ Atualizações periódicas"} · {totalNaoLidas} não lida(s)</p>
   </div><button type="button" className="chat-fechar-lista botao-secundario" onClick={()=>setContatosAbertos(false)} aria-label="Fechar conversas">Fechar</button></div>
   {!estado?<p className="text-sm text-[var(--muted)]">Carregando conversas...</p>:
   <div className="grid min-w-0 gap-1" role="group" aria-label="Selecionar conversa">
    {abertas.map(c=><button type="button" key={c.id} onClick={()=>mudarConversa(c.id)}
      className={"flex min-w-0 w-full items-center justify-between gap-2 overflow-hidden rounded-lg border p-3 text-left text-sm "+(c.id===conversa?"border-[var(--primary)]":"border-[var(--border)]")}>
      <span className="block min-w-0 flex-1 overflow-hidden"><strong className="block truncate">{c.nome}</strong>
       <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)]">{c.ultimaMensagem?.slice(0,65)||"Sem mensagens"}</span>
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
  <section className="chat-area-mensagens cartao flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden p-3 sm:p-4" aria-label="Mensagens">
    <div className="chat-cabecalho-mensagens flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
      <div className="flex min-w-0 items-center gap-2">
       <button type="button" className="chat-botao-contatos botao-secundario" onClick={()=>setContatosAbertos(true)} aria-label="Abrir conversas" aria-expanded={contatosAbertos}>Conversas{totalNaoLidas>0?` (${totalNaoLidas})`:""}</button>
       <div className="min-w-0"><h2 className="truncate text-base font-bold">{atual?.nome??"Equipe — Geral"}</h2>
        <p className="text-xs text-[var(--muted)]">{atual?.tipo==="privada"?"Conversa privada":"Canal geral da equipe"}</p></div>
      </div>
      <div className="chat-ferramentas-mensagens flex min-w-0 flex-wrap items-center gap-2">
      <form className="flex min-w-0 flex-wrap items-center gap-2" onSubmit={e=>{e.preventDefault();setMensagens([]);setMais(false);setPesquisa(busca.trim().slice(0,100));}}>
       <input className={estiloCampo+" max-w-[170px]"} type="search" value={busca} onChange={e=>setBusca(e.target.value)}
        placeholder="Buscar mensagens" aria-label="Pesquisar mensagens" maxLength={100}/>
       <button className="botao-secundario" type="submit">Buscar</button>
       {pesquisa&&<button className="botao-secundario" type="button" onClick={()=>{setBusca("");setMensagens([]);setMais(false);setPesquisa("");}}>Limpar</button>}
      </form>
      <button type="button" className="botao-secundario" onClick={()=>void limparConversa()} disabled={limpando||!estado}
        title="Ocultar o histórico anterior somente para sua conta">{limpando?"Limpando...":"Limpar conversa"}</button>
      </div>
    </div>
    {aviso&&<p className="mt-3 text-sm text-amber-700" role="alert">{aviso}</p>}
    {notificacao&&<button type="button" className="mt-3 rounded-lg border border-[var(--border)] p-2 text-left text-sm" onClick={()=>{setNotificacao("");void atualizarEstado();}}>{notificacao} · Ver conversas</button>}
    <div ref={historicoRef} className="chat-historico min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-3" aria-label="Histórico de mensagens">
     {mais&&<button type="button" className="botao-secundario mb-4" onClick={()=>{const area=historicoRef.current;if(area)ajusteHistorico.current={altura:area.scrollHeight,topo:area.scrollTop};void carregar(conversa,pesquisa,mensagens[0]?.id??null);}}>Carregar mensagens anteriores</button>}
     {mensagens.length===0?<p className="py-10 text-center text-sm text-[var(--muted)]">{pesquisa?"Nenhuma mensagem encontrada.":"Nenhuma mensagem ainda. Envie a primeira!"}</p>:
      <ul className="grid min-w-0 gap-3">{mensagens.map(m=><li key={m.id} className={"flex min-w-0 "+(m.autorId===usuarioId?"justify-end":"justify-start")}>
       <article className={"chat-balao group relative min-w-0 max-w-[93%] rounded-2xl px-3 py-2.5 sm:max-w-[82%] "+(m.autorId===usuarioId?"bg-[var(--surface-alt)]":"bg-[var(--background)]")}>
        <div className="mb-1 flex min-w-0 items-start justify-between gap-2 text-xs text-[var(--muted)]">
         <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <strong className="max-w-full truncate">{m.autorId===usuarioId?"Você":m.autor}</strong>
          <time dateTime={m.criadoEm}>{horario(m.criadoEm)}</time>
         </div>
         <details className="chat-mensagem-acoes relative z-20 shrink-0"
          onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.open=false;}}>
          <summary className="chat-mensagem-gatilho flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md text-lg leading-none transition-colors hover:bg-[var(--surface)] focus-visible:bg-[var(--surface)] [&::-webkit-details-marker]:hidden"
            aria-label={"Ações da mensagem de "+m.autor} title="Ações da mensagem">
           <span aria-hidden="true">⋯</span>
          </summary>
          <div className={"absolute top-full z-30 mt-1 grid min-w-44 gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 text-left text-sm text-[var(--text)] shadow-lg "+(m.autorId===usuarioId?"right-0":"left-0")}>
           {!m.apagadaParaTodos&&<button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-alt)] focus-visible:bg-[var(--surface-alt)]" disabled={operando!==null}
             onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");setRespondendo(m);setPesquisa("");setBusca("");}}>Responder</button>}
           <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-alt)] focus-visible:bg-[var(--surface-alt)]" disabled={operando!==null}
             onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");void apagarMensagem(m.id,false);}}>Apagar para mim</button>
           {m.autorId===usuarioId&&!m.apagadaParaTodos&&<button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-alt)] focus-visible:bg-[var(--surface-alt)]"
             disabled={operando!==null} onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");void apagarMensagem(m.id,true);}}>Apagar para todos</button>}
          </div>
         </details>
        </div>
        {m.respostaA&&<blockquote className="mb-2 min-w-0 max-w-full border-l-2 border-[var(--primary)] bg-[var(--surface)] p-2 text-xs">
          <strong className="block text-[var(--muted)]">{m.respostaA.autor??"Mensagem anterior"}</strong>
          <p className="line-clamp-2 break-words [overflow-wrap:anywhere]">{m.respostaA.texto}</p>
        </blockquote>}
        <p className={"max-w-full whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] "+(m.apagadaParaTodos?"italic text-[var(--muted)]":"")}>
          {m.apagadaParaTodos?"Mensagem apagada":<ConteudoMensagem texto={m.texto}/>}
        </p>
       </article>
      </li>)}</ul>}
     <div aria-hidden="true"/>
    </div>
    <div className="chat-compositor shrink-0 border-t border-[var(--border)] pt-2">
     {respondendo&&<div className="mb-3 flex min-w-0 items-center justify-between gap-2 rounded-lg border-l-4 border-[var(--primary)] bg-[var(--surface-alt)] p-3">
       <div className="min-w-0"><strong className="block text-xs">Respondendo a {respondendo.autorId===usuarioId?"você":respondendo.autor}</strong>
         <p className="line-clamp-2 break-words text-xs [overflow-wrap:anywhere]">{respondendo.texto}</p>
       </div>
       <button className="botao-secundario shrink-0" type="button" onClick={()=>setRespondendo(null)} aria-label="Cancelar resposta">Cancelar</button>
     </div>}
     <p className="mb-2 min-h-4 text-xs text-[var(--muted)]" aria-live="polite">{digitando}</p>
     <form onSubmit={e=>void enviarTexto(e)} className="flex items-end gap-2">
      <textarea className={estiloCampo+" min-h-12 max-h-28 min-w-0 flex-1 resize-none overflow-y-auto"} value={texto} onChange={e=>escrever(e.target.value)}
       onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void enviarTexto(e as unknown as FormEvent);}}}
       rows={2} maxLength={2000} placeholder="Digite sua mensagem... (Enter para enviar)" aria-label="Nova mensagem"
       disabled={enviando||!estado}/>
      <button className="botao-primario" type="submit" disabled={enviando||!texto.trim()}>Enviar</button>
     </form>
     <p className="chat-dica-envio mt-1 text-xs text-[var(--muted)]">Shift+Enter pula linha. Evite dados confidenciais de clientes. <Link href="/artigos">Compartilhe links de artigos do KB</Link>.</p>
    </div>
  </section>
 </div>;
}
