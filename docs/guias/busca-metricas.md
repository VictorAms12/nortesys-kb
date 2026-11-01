# Benchmark da busca — corpus de ouro

O corpus versionado contém 63 consultas, incluindo 53 positivas e 10 negativas. Os documentos de suporte são sintéticos, mais o artigo versionado no repositório; não há acesso ao catálogo da produção.

Baseline: Fuse anterior com `threshold=0.38` e campos sem normalização adicional. Atual: `threshold=0.30`, normalização, sinônimos com prioridade inferior e filtro de distâncias: até 3 caracteres exato; 4–7 uma edição; 8+ duas; códigos/dígitos exatos.

A CI emite métricas sob `[busca-ouro]`: baseline top-3, novo top-3, precisão percentual, falsos positivos, latência média de busca e tamanho KB do índice/vocabulário. Não preencher números antes da medição observada. A média exclui requisições HTTP, Neon, latência do navegador e construção do índice.

Critérios: top-3 de pelo menos 90% entre positivos, zero resultados em consultas negativas e tempo médio inferior a 50 ms. Para a base real, repetir no ambiente Preview por papel, sem alterar permissões.
