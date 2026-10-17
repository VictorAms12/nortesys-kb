import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { listarContas } from "../../../lib/admin-usuarios";
import { AlertaAdmin } from "../../../components/alerta-admin";
import { BotaoConfirmar } from "../../../components/botao-confirmar";
export const dynamic="force-dynamic";
const campo="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Usuarios({searchParams}:Props) {
  const sessao=await exigirPapel(["administrador"]);
  const contas=await listarContas();const {aviso}=await searchParams;
  return <div className="space-y-8">
    <AlertaAdmin codigo={aviso}/>
    <section className="cartao p-6 sm:p-7"><p className="sobre-titulo">Gerenciamento de contas</p><h2 className="titulo-secao mb-2">Cadastrar colaborador</h2><p className="mb-5 text-sm text-[var(--muted)]">Crie um acesso individual e atribua o perfil apropriado.</p>
      <form method="post" action="/api/admin/usuarios" className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="acao" value="criar"/>
        <label className="grid gap-1 text-sm">Usuário<input className={campo} name="usuario" pattern="[a-z][a-z0-9._-]{2,39}" required placeholder="joao.silva"/></label>
        <label className="grid gap-1 text-sm">Nome<input className={campo} name="nome" maxLength={80} minLength={2} required/></label>
        <label className="grid gap-1 text-sm">Perfil<select className={campo} name="papel"><option value="leitor">Leitor</option><option value="editor">Editor</option><option value="administrador">Administrador</option></select></label>
        <label className="grid gap-1 text-sm">Credencial inicial (mínimo 12 caracteres)<input className={campo} name="credencial" type="password" minLength={12} maxLength={256} autoComplete="new-password" required/></label>
        <p className="text-xs text-[var(--muted)] sm:col-span-2">Defina uma credencial temporária forte e entregue por canal privado. O banco armazena apenas o hash. Não a reutilize em outras contas.</p>
        <button className="botao-primario w-fit" type="submit">Criar usuário</button>
      </form>
    </section>
    <section><div className="cabecalho-secao mb-4"><div><p className="sobre-titulo">Equipe com acesso</p><h2 className="titulo-secao">Contas cadastradas</h2></div><span className="etiqueta">{contas.length} usuário(s)</span></div><div className="grid gap-4">
      {contas.map(c=><article key={c.id} className="cartao p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-bold">{c.nome} <span className="text-sm font-normal text-[var(--muted)]">@{c.usuario}</span></h3><span className="etiqueta">{c.ativo?"Ativo":"Inativo"} · {c.papel}</span></div>
        <form action="/api/admin/usuarios" method="post" className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="acao" value="editar"/><input type="hidden" name="id" value={c.id}/>
          <label className="grid gap-1 text-sm">Nome<input className={campo} name="nome" defaultValue={c.nome} required/></label>
          <label className="grid gap-1 text-sm">Perfil<select className={campo} name="papel" defaultValue={c.papel} disabled={c.id===sessao.id}><option value="administrador">Administrador</option><option value="editor">Editor</option><option value="leitor">Leitor</option></select></label>
          <div className="flex items-end"><button type="submit" className="botao-secundario" disabled={c.id===sessao.id}>Salvar perfil</button></div>
        </form>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <form action="/api/admin/usuarios" method="post" className="flex flex-wrap items-end gap-2"><input type="hidden" name="acao" value="senha"/><input type="hidden" name="id" value={c.id}/>
            <label className="grid gap-1 text-sm">Nova credencial<input className={campo} name="credencial" type="password" minLength={12} maxLength={256} autoComplete="new-password" required/></label>
            <BotaoConfirmar mensagem="Redefinir a credencial desta conta? Isso encerrará as sessões existentes." rotulo="Redefinir"/>
          </form>
          {c.id!==sessao.id && <form action="/api/admin/usuarios" method="post"><input type="hidden" name="id" value={c.id}/><input type="hidden" name="nome" value={c.nome}/><input type="hidden" name="acao" value={c.ativo?"desativar":"ativar"}/><BotaoConfirmar mensagem={c.ativo?"Desativar esta conta? O acesso será encerrado.":"Reativar o acesso desta conta?"} rotulo={c.ativo?"Desativar":"Ativar"}/></form>}
        </div>
      </article>)}
    </div></section>
  </div>;
}
