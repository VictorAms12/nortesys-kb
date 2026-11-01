/** Resolução estritamente privada: aliases nunca tornam rascunhos/arquivados públicos. */
export const SQL_RESOLVER_ALIAS_ARTIGO = `SELECT a.categoria,a.slug FROM kb_artigo_aliases h
 JOIN kb_artigos a ON a.id=h.artigo_id
 WHERE h.url_anterior=$1 AND a.arquivado=FALSE
   AND ($2::text<>'leitor' OR a.status<>'rascunho')
 LIMIT 1`;
