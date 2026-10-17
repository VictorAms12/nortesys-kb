import type { NextRequest } from "next/server";
import { rotasImagens } from "../../../../lib/imagens-servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return rotasImagens.ler(req, (await params).id);
}
