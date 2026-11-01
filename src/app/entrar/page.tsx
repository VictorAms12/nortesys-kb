import type {Metadata} from "next";
import {FormularioLogin} from "../../components/formulario-login";
import {AlternarTema} from "../../components/alternar-tema";
import {autenticacaoConfigurada,destinoSeguro} from "../../lib/sessao";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Entrar | Nortesys KB",robots:{index:false,follow:false}};
type Props={searchParams:Promise<{erro?:string;retorno?:string}>};
export default async function PaginaEntrar({searchParams}:Props){
 const {erro,retorno}=await searchParams;
 const pronta=autenticacaoConfigurada();
 const mensagem=erro==="bloqueado"?"Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.":
 erro==="credenciais"?"Usuário ou senha incorretos.":erro==="configuracao"?"Acesso ainda não configurado pelo administrador.":
 erro==="indisponivel"?"Não foi possível consultar o banco de dados. Tente novamente.":null;
 return <main id="conteudo" className="login-page">
  <div className="login-shell">
   <div className="login-topo"><span className="login-marca"><strong>Nortesys</strong><span>KB</span></span><AlternarTema/></div>
   <section className="login-card" aria-labelledby="titulo-login">
    <p className="login-eyebrow">Ambiente interno de suporte</p>
    <h1 id="titulo-login">Base de conhecimento do suporte</h1>
    <p className="login-subtitle">Entre com suas credenciais para consultar orientações e procedimentos da equipe.</p>
    {!pronta&&<div className="login-alert" role="alert">O acesso não está configurado. Contate o administrador.</div>}
    {mensagem&&<div id="login-alerta" className="login-alert" role="alert">{mensagem}</div>}
    <FormularioLogin pronta={pronta} retorno={destinoSeguro(retorno)} credenciaisInvalidas={erro==="credenciais"}/>
    <p className="login-support">Para acesso ou redefinição de senha, contate o administrador.</p>
   </section>
   <p className="login-rodape">Nortesys KB · Uso interno</p>
  </div>
 </main>;
}
