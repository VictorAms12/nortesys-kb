import type { Metadata } from "next";
import { FormularioLogin } from "../../components/formulario-login";
import { AlternarTema } from "../../components/alternar-tema";
import { IconeInterface } from "../../components/icone-interface";
import { autenticacaoConfigurada, destinoSeguro } from "../../lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar | Nortesys KB", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ erro?: string; retorno?: string }> };

export default async function PaginaEntrar({ searchParams }: Props) {
  const { erro, retorno } = await searchParams;
  const pronta = autenticacaoConfigurada();
  const mensagem = erro === "bloqueado"
    ? "Muitas tentativas de acesso. Aguarde 15 minutos antes de tentar novamente."
    : erro === "credenciais" ? "Usuário ou senha incorretos. Confira os dados e tente novamente."
    : erro === "configuracao" ? "O acesso ainda não foi configurado pelo administrador."
    : erro === "indisponivel" ? "Não foi possível consultar o banco de dados. Tente novamente em alguns instantes."
    : null;

  return (
    <main id="conteudo" className="login-page">
      <div className="login-shell">
        <aside className="login-intro" aria-label="Sobre o Nortesys KB">
          <div className="login-brand">
            <span className="login-logo" aria-hidden="true">N</span>
            <span className="login-brand-text"><strong>Nortesys KB</strong><small>Central de conhecimento</small></span>
          </div>
          <div className="login-intro-content">
            <p className="login-eyebrow">CONHECIMENTO QUE CONECTA</p>
            <h2>As respostas da equipe, em um só lugar.</h2>
            <p>Procedimentos, tutoriais e soluções técnicas organizados para facilitar cada atendimento.</p>
            <div className="login-tags" aria-label="Conteúdos disponíveis">
              <span>Procedimentos</span><span>Tutoriais</span><span>Soluções técnicas</span>
            </div>
          </div>
          <div className="login-intro-footer"><IconeInterface nome="escudo" width={18} height={18}/> Ambiente interno · Acesso restrito</div>
        </aside>

        <section className="login-panel" aria-labelledby="titulo-login">
          <div className="login-panel-top">
            <div className="login-mobile-brand"><span className="login-logo" aria-hidden="true">N</span><strong>Nortesys KB</strong></div>
            <AlternarTema />
          </div>

          <div className="login-card">
            <div className="login-card-icon" aria-hidden="true"><IconeInterface nome="escudo" width={23} height={23}/></div>
            <p className="login-kicker">ACESSO À PLATAFORMA</p>
            <h1 id="titulo-login">Bem-vindo de volta</h1>
            <p className="login-subtitle">Entre com suas credenciais para acessar a base de conhecimento.</p>

            {!pronta && <div className="login-alert" role="alert"><strong>Acesso indisponível.</strong><span>Solicite ao administrador a configuração do banco de dados.</span></div>}
            {mensagem && <div id="login-alerta" className="login-alert" role="alert"><strong>Não foi possível entrar.</strong><span>{mensagem}</span></div>}

            <FormularioLogin pronta={pronta} retorno={destinoSeguro(retorno)} credenciaisInvalidas={erro === "credenciais"}/>
            <div className="login-support"><IconeInterface nome="escudo" width={17} height={17}/><span>Precisa de acesso ou esqueceu sua senha? Solicite ajuda ao administrador.</span></div>
          </div>
          <p className="login-panel-footer">© {new Date().getFullYear()} Nortesys KB · Uso interno da equipe</p>
        </section>
      </div>
    </main>
  );
}
