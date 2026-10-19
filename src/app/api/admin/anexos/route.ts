import type { NextRequest } from "next/server";
import { enviarAnexo } from "../../../../lib/anexos";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest) {return enviarAnexo(req);}
