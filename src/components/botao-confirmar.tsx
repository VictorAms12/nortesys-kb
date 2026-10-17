"use client";
export function BotaoConfirmar({mensagem,rotulo}:{mensagem:string;rotulo:string}){
  return <button className="botao-secundario" type="submit" onClick={event=>{if(!window.confirm(mensagem))event.preventDefault();}}>{rotulo}</button>;
}
