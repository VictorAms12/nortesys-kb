import type { NextRequest } from "next/server";
import { rotasImagens } from "../../../../lib/imagens-servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) { return rotasImagens.enviar(req); }
