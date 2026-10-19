import type { NextRequest } from "next/server";
import { baixarAnexo } from "../../../../lib/anexos";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  return baixarAnexo(req,(await params).id);
}
