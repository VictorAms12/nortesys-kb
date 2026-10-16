import type { Metadata } from "next";
import { autenticacaoConfigurada, destinoSeguro } from "../../lib/sessao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar | Nortesys KB", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ erro?: string; retorno?: string }> };

export default async function PaginaEntrar({ searchParams }: Props) {
  const { erro, retorno } = await searchParams;
  const pronta = autenticacaoConfigurada();
  const mensagem = erro === "bloqueado"
    ? "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente."
    : erro === "credenciais" ? "Usuário ou senha incorretos. Confira e tente novamente."
    : erro === "configuracao" ? "O endereço do banco de dados ainda não foi configurado."
    : erro === "indisponivel" ? "Não foi possível acessar o banco de dados agora. Tente novamente mais tarde."
    : null;
  return (
    <main id="conteudo" className="conteiner grid min-h-[75vh] place-items-center py-12">
      <section className="cartao w-full max-w-md p-7 sm:p-9" aria-labelledby="titulo-login">
        <div className="mb-6 grid size-12 place-items-center rounded-xl bg-teal-700 text-2xl font-black text-white" aria-hidden="true">N</div>
        <p className="sobre-titulo">Acesso interno · Contas individuais</p>
        <h1 id="titulo-login" className="titulo-pagina mt-2 text-3xl">Nortesys KB</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">Entre com o usuário e a senha fornecidos pelo responsável da base de conhecimento.</p>
        {!pronta ? <p className="aviso-artigo mt-6" role="alert">Configure DATABASE_URL no servidor e execute a migração do banco antes de utilizar o acesso.</p> : null}
        {mensagem ? <p role="alert" className="aviso-artigo mt-6">{mensagem}</p> : null}
        <form method="post" action="/api/autenticacao/entrar" className="mt-7 grid gap-4">
          <input type="hidden" name="retorno" value={destinoSeguro(retorno)} />
          <label className="campo-filtro" htmlFor="usuario">Usuário</label>
          <input id="usuario" name="usuario" className="campo-pesquisa" type="text" minLength={3} maxLength={40} pattern="[a-z][a-z0-9._-]{2,39}" required autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={!pronta}/>
          <label className="campo-filtro" htmlFor="senha">Senha</label>
          <input id="senha" name="senha" className="campo-pesquisa" type="password" minLength={12} maxLength={1024} required autoComplete="current-password" disabled={!pronta} />
          <button className="botao-primario mt-2 w-full" type="submit" disabled={!pronta}>Entrar na base</button>
        </form>
        <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Cada colaborador possui sua própria conta. Sessão de até 8 horas. Não compartilhe senhas ou dados de clientes.</p>
      </section>
    </main>
  );
}
