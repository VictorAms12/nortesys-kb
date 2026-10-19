import type { NextRequest } from "next/server";
import { removerAnexo } from "../../../../../lib/anexos";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  return removerAnexo(req,(await params).id);
}
