# Sinônimos e radicais da busca

Os grupos vivem em `config/sinonimos.ts` e são aplicados **em ambos os sentidos**, como expansão secundária: o termo exato digitado sempre tem prioridade. Eles não representam equivalência fiscal; `NF-e`, `NFC-e`, `CFOP`, `CST`, `CSOSN` e `NCM` continuam documentos/conceitos distintos. Grupos amplos estão marcados **revisar com o time**.

Para adicionar novo termo: (1) consultar registros agregados de lacunas, sem dados pessoais; (2) selecionar grupo que representa o mesmo propósito, ou criar um grupo com `id`, `termos` e `observacao`; (3) submeter PR com casos positivos e negativos em `tests/busca-ouro.json`; (4) obter aprovação do responsável técnico do suporte ERP **e**, para termos fiscais, de um analista fiscal; (5) verificar ranking, visibilidade por papel e CI antes de merge.

O radicalizador é deliberadamente leve: plurais e gerúndios usuais, sem mudar códigos numéricos nem siglas; não é lematizador completo e não deve ser usado para inferir códigos fiscais. Quando termos relacionados forem incorretos ou resultarem em ruído, remova a expansão e documente o motivo.

## Registro de lacunas e melhoria contínua

1. Usar `src/app/api/busca/lacuna/route.ts` para identificar termos agregados sem resultados, sem copiar identidade nem consulta sensível.
2. Reproduzir localmente, conferir visibilidade por papel e decidir se há um artigo adequado.
3. Se houver artigo, propor expansão realista na configuração; senão, abrir tarefa editorial revisada por suporte ERP/fiscal.
4. Acrescentar caso no `tests/busca-ouro.json` e executar `npm run testar:busca` e CI. Critérios: 90% top-3, zero falsos positivos e média inferior a 50 ms.
5. Medir também o comportamento com artigos reais em ambiente Preview: o corpus sintético não substitui a base Neon.
