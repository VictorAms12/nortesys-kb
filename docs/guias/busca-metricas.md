# Benchmark da busca — corpus de ouro

O corpus versionado contém 63 consultas, incluindo 53 positivas e 10 negativas. Os documentos de suporte são sintéticos, mais o artigo versionado no repositório; não há acesso ao catálogo da produção.

Baseline: Fuse anterior com `threshold=0.38` e campos sem normalização adicional. Atual: `threshold=0.30`, normalização, sinônimos com prioridade inferior e filtro de distâncias: até 3 caracteres exato; 4–7 uma edição; 8+ duas; códigos/dígitos exatos.

A CI emite métricas sob `[busca-ouro]`: baseline top-3, novo top-3, precisão percentual, falsos positivos, latência média de busca e tamanho KB do índice/vocabulário. Medição confirmada no GitHub Actions do commit d7df8a0: 63 consultas (53 positivas e 10 negativas); top-3 antes 53/53 e depois 53/53 (ambos 100%); falsos positivos depois 0; média depois 1,79 ms; índice/vocabulário serializados 8,7 KB. **O corpus não demonstra ganho na taxa top-3**, mas testa a compatibilidade e a tolerância sem ruído em dados controlados. A média exclui requisições HTTP, Neon, latência do navegador e construção do índice.

Critérios: top-3 de pelo menos 90% entre positivos, zero resultados em consultas negativas e tempo médio inferior a 50 ms. Para a base real, repetir no ambiente Preview por papel, sem alterar permissões.

## Ensaio adicional de sinônimos sem termos literais

Para impedir que o corpus seja trivial, foram retiradas menções explícitas de `DANFE`, `imprimir` e `demora` dos documentos-alvo, mantendo os conceitos correspondentes (`NF-e`, `impressora` e `lentidão`). O teste exige que as três consultas alcancem o artigo correto **via expansão secundária**. A comparação numérica original de 63 casos permanece registrada acima; o novo corpus com 64 casos exige nova medição CI antes de publicar números atualizados.

## Resultado do corpus ampliado (GitHub Actions, 01/11/2026)

**64 consultas:** 54 positivas e 10 negativas. Baseline (`threshold=0.38`) teve **51/54 (94,4%)** acertos no top-3; busca nova (`threshold=0.30` mais normalização e sinônimos) teve **54/54 (100%)**, ganho de **5,6 pontos percentuais** no corpus controlado. **Zero falsos positivos** entre as dez consultas negativas. Tempo médio: **2,05 ms** por consulta. Índice e vocabulário serializados: **8,3 KB**.

Os três ganhos foram isolados no conjunto artificial removendo menções literais de DANFE, imprimir e demora; não comprovam melhora em buscas reais do Neon. As 6 sessões E2E, navegação móvel autenticada e custo sob grande catálogo seguem pendentes de homologação.
