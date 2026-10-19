"use client";
import {useMemo,useState} from "react";
import {formatarRegistro,type CamposRegistro} from "../lib/registro-atendimento";
const vazio:CamposRegistro={tipo:"",dificuldade:"",versao:"",atualizou:"Não informado",erro:"",repasse:"",tarefa:"",resumo:"",resultado:""};
const campos: {chave:keyof CamposRegistro;rotulo:string;exemplo:string;multilinha?:boolean}[]=[
  {chave:"tipo",rotulo:"Tipo de atendimento",exemplo:"Ex.: Suporte ERP / NF-e"},
  {chave:"dificuldade",rotulo:"Dificuldade encontrada",exemplo:"Descreva a solicitação do usuário",multilinha:true},
  {chave:"versao",rotulo:"Versão atual do cliente",exemplo:"Versão do ERP informada no atendimento"},
  {chave:"erro",rotulo:"Sistema gerou algum erro? Qual?",exemplo:"Mensagem/código; sem dados pessoais do cliente",multilinha:true},
  {chave:"repasse",rotulo:"Repassado ao gestor técnico com vídeo ou prints?",exemplo:"Sim, com prints / Não / Pendente",multilinha:true},
  {chave:"tarefa",rotulo:"Link da tarefa",exemplo:"https://..."},
  {chave:"resumo",rotulo:"Resumo do atendimento",exemplo:"Etapas realizadas e orientações fornecidas",multilinha:true},
  {chave:"resultado",rotulo:"Resultado",exemplo:"Resolvido / Aguardando / Escalado",multilinha:true},
];
export function GeradorRegistro() {
  const [dados,setDados]=useState<CamposRegistro>(vazio);
  const [mensagem,setMensagem]=useState("");
  const texto=useMemo(()=>formatarRegistro(dados),[dados]);
  function atualizar(c:keyof CamposRegistro,valor:string){setDados(atual=>({...atual,[c]:valor}));setMensagem("");}
  async function copiar(){
    try {await navigator.clipboard.writeText(texto);setMensagem("Registro copiado para a área de transferência.");}
    catch {setMensagem("A cópia foi bloqueada. Selecione o texto abaixo e copie manualmente.");}
  }
  return <div className="grid gap-5 xl:grid-cols-2">
    <section className="cartao grid gap-4 p-5" aria-labelledby="registro-campos">
      <h2 id="registro-campos" className="text-lg font-bold">Informações do atendimento</h2>
      <p className="text-sm leading-6 text-[var(--muted)]">Os dados permanecem nesta aba e não são enviados ou salvos no Neon. Evite nomes completos, documentos, credenciais e prints contendo dados pessoais.</p>
      {campos.slice(0,3).map(c=><label key={c.chave} className="grid gap-1 text-sm font-semibold">{c.rotulo}
        {c.multilinha?<textarea className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]" rows={3} maxLength={3000}
          placeholder={c.exemplo} value={dados[c.chave]} onChange={e=>atualizar(c.chave,e.target.value)}/>:
          <input className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]"
          maxLength={3000} placeholder={c.exemplo} value={dados[c.chave]} onChange={e=>atualizar(c.chave,e.target.value)}/>}
      </label>)}
      <label className="grid gap-1 text-sm font-semibold">Precisou atualizar?
        <select className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]"
          value={dados.atualizou} onChange={e=>atualizar("atualizou",e.target.value)}>
          <option>Não informado</option><option>Sim</option><option>Não</option>
        </select>
      </label>
      {campos.slice(3).map(c=><label key={c.chave} className="grid gap-1 text-sm font-semibold">{c.rotulo}
        {c.multilinha?<textarea className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]" rows={3} maxLength={3000}
          placeholder={c.exemplo} value={dados[c.chave]} onChange={e=>atualizar(c.chave,e.target.value)}/>:
          <input className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)]"
          maxLength={3000} placeholder={c.exemplo} value={dados[c.chave]} onChange={e=>atualizar(c.chave,e.target.value)}/>}
      </label>)}
      <button type="button" className="botao-secundario justify-self-start" onClick={()=>{
        if(window.confirm("Limpar todas as informações deste registro?")){setDados(vazio);setMensagem("");}
      }}>Limpar formulário</button>
    </section>
    <section className="cartao grid content-start gap-4 p-5" aria-labelledby="registro-resultado">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="registro-resultado" className="text-lg font-bold">Registro pronto para copiar</h2>
        <button type="button" className="botao-primario" onClick={()=>void copiar()}>Copiar registro</button>
      </div>
      <p className="text-xs text-[var(--muted)]" role="status" aria-live="polite">{mensagem}</p>
      <textarea aria-label="Texto gerado do registro" className="min-h-[460px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 font-mono text-sm text-[var(--text)]"
        rows={22} readOnly value={texto} onFocus={e=>e.currentTarget.select()}/>
    </section>
  </div>;
}
