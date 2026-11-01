import type {Papel} from "./usuarios";

/** 1,5 MB é o limite conservador usado antes do teto de 2 MB do Incremental Cache. */
export const LIMITE_CONSERVADOR_CACHE_BYTES=1_500_000;

/** Só produz números; o conteúdo dos artigos jamais entra no log. */
export function medirPayloadCache(payload:unknown):{bytes:number;kb:number;acimaLimite:boolean}{
 const bytes=Buffer.byteLength(JSON.stringify(payload),"utf8");
 return {bytes,kb:Math.round((bytes/1024)*10)/10,acimaLimite:bytes>LIMITE_CONSERVADOR_CACHE_BYTES};
}

/** Executado quando o Next recalcula um item da unstable_cache, não a cada requisição. */
export function registrarTamanhoCacheArtigos(papel:Papel,payload:unknown,
 registrar:(msg:string)=>void=console.info):ReturnType<typeof medirPayloadCache>{
 const tamanho=medirPayloadCache(payload);
 registrar("[kb-cache-artigos] papel="+papel+" tamanho_kb="+tamanho.kb+
  " limite_kb="+Math.round(LIMITE_CONSERVADOR_CACHE_BYTES/1024)+
  " acima_limite="+(tamanho.acimaLimite?"sim":"nao"));
 return tamanho;
}
