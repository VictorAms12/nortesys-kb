import Link from "next/link";
import { exigirPapel } from "../../../../lib/autenticacao-servidor";
import { FormularioArtigo } from "../../../../components/formulario-artigo";
import { obterRegistroArtigo } from "../../../../lib/artigos-banco";
import { AlertaAdmin } from "../../../../components/alerta-admin";
type Props={searchParams:Promise<{aviso?:string;modelo?:string}>};
export default async function Novo({searchParams}:Props) {
  await exigirPapel(["administrador","editor"]);const {aviso,modelo}=await searchParams;
  const origem=modelo?await obterRegistroArtigo(modelo):null;
  return <section><Link href="/admin/artigos" className="text-sm">← Todos os artigos</Link><h2 className="titulo-secao my-5">Novo artigo</h2><AlertaAdmin codigo={aviso}/>{origem&&<p className="mb-4 rounded-lg border border-[var(--border)] p-3 text-sm">Cópia do artigo “{origem.titulo}”. O novo artigo será um rascunho. Imagens privadas e anexos não são copiados.</p>}<FormularioArtigo modelo={origem??undefined}/></section>;
}
