import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { NOME_COOKIE, obterSessao } from "../../../../lib/sessao";
import { consultar } from "../../../../lib/banco";
import { obterDadosBusca, buscadorEmMemoria } from "../../../../lib/cache-busca";
import { executarBusca, executarBuscaOu } from "../../../../lib/busca";
import { sugerirConsultas } from "../../../../lib/busca-sugestoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

/** Reservas de dez consultas reduzem até 90% das escritas de cota no Neon. */
const BLOCO = 10;
const reservas = new Map<string, { restantes: number; expiraEm: number }>();

async function reservarConsulta(usuarioId: string): Promise<boolean> {
  const agora = Date.now();
  const local = reservas.get(usuarioId);
  if (local && local.restantes > 0 && local.expiraEm > agora) {
    local.restantes--;
    return true;
  }
  // A reserva no banco limita o total global mesmo entre várias instâncias.
  const linhas = await consultar<{ quantidade: number }>(`
    INSERT INTO kb_busca_sugestoes_limites(usuario_id, janela_em, quantidade)
    VALUES ($1, NOW(), $2)
    ON CONFLICT (usuario_id) DO UPDATE SET
      quantidade = CASE WHEN kb_busca_sugestoes_limites.janela_em <= NOW() - INTERVAL '1 minute'
        THEN $2 ELSE kb_busca_sugestoes_limites.quantidade + $2 END,
      janela_em = CASE WHEN kb_busca_sugestoes_limites.janela_em <= NOW() - INTERVAL '1 minute'
        THEN NOW() ELSE kb_busca_sugestoes_limites.janela_em END
    WHERE kb_busca_sugestoes_limites.janela_em <= NOW() - INTERVAL '1 minute'
       OR kb_busca_sugestoes_limites.quantidade <= 90 - $2
    RETURNING quantidade
  `, [usuarioId, BLOCO]);
  if (!linhas.length) return false;
  if (reservas.size > 2000) reservas.clear();
  reservas.set(usuarioId, { restantes: BLOCO - 1, expiraEm: agora + 55_000 });
  return true;
}

export async function GET(req: NextRequest) {
  const sessao = await obterSessao(req.cookies.get(NOME_COOKIE)?.value);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401, headers });
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length > 120) return NextResponse.json({ erro: "Consulta muito longa" }, { status: 400, headers });
  try {
    if (q.length >= 2 && !await reservarConsulta(sessao.id))
      return NextResponse.json({ erro: "Muitas consultas. Tente novamente em instantes." },
        { status: 429, headers: { ...headers, "Retry-After": "60" } });

    const dados = await obterDadosBusca(sessao.papel);
    if (q.length < 2) return NextResponse.json({
      resultados: [], categorias: dados.categorias, atualizadoEm: dados.atualizadoEm,
    }, { headers });

    const buscador=buscadorEmMemoria(sessao.papel,dados);
    const exatos=executarBusca(buscador,q);
    const aproximados=exatos.length===0?executarBuscaOu(buscador,q):[];
    const resultados = (exatos.length?exatos:aproximados)
      .slice(0, 6).map(({ artigo }) => ({
        url: artigo.url,
        titulo: artigo.titulo,
        categoria: artigo.nomeCategoria,
        codigos: artigo.codigosErro?.slice(0, 2) ?? [],
      }));
    return NextResponse.json({ resultados, aproximada:exatos.length===0&&aproximados.length>0,
      alternativas:exatos.length===0?sugerirConsultas(q,dados.vocabulario):[] }, { headers });
  } catch (erro) {
    console.error("[busca] Falha ao consultar sugestões", erro instanceof Error ? erro.name : "erro");
    return NextResponse.json({ erro: "Busca temporariamente indisponível" }, { status: 503, headers });
  }
}
