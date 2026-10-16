import Link from "next/link";
import { exigirPapel } from "../../../../lib/autenticacao-servidor";
import { FormularioArtigo } from "../../../../components/formulario-artigo";
import { AlertaAdmin } from "../../../../components/alerta-admin";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Novo({searchParams}:Props) {
  await exigirPapel(["administrador","editor"]);const {aviso}=await searchParams;
  return <section><Link href="/admin/artigos" className="text-sm">← Todos os artigos</Link><h2 className="titulo-secao my-5">Novo artigo</h2><AlertaAdmin codigo={aviso}/><FormularioArtigo/></section>;
}
