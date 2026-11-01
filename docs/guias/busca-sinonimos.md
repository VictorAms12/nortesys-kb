# Sinônimos e radicais da busca

Os grupos vivem em `config/sinonimos.ts` e são aplicados **em ambos os sentidos**, como expansão secundária: o termo exato digitado sempre tem prioridade. Eles não representam equivalência fiscal; `NF-e`, `NFC-e`, `CFOP`, `CST`, `CSOSN` e `NCM` continuam documentos/conceitos distintos. Grupos amplos estão marcados **revisar com o time**.

Para adicionar novo termo: (1) consultar registros agregados de lacunas, sem dados pessoais; (2) selecionar grupo que representa o mesmo propósito, ou criar um grupo com `id`, `termos` e `observacao`; (3) submeter PR com casos positivos e negativos em `tests/busca-ouro.json`; (4) obter aprovação do responsável técnico do suporte ERP **e**, para termos fiscais, de um analista fiscal; (5) verificar ranking, visibilidade por papel e CI antes de merge.

O radicalizador é deliberadamente leve: plurais e gerúndios usuais, sem mudar códigos numéricos nem siglas; não é lematizador completo e não deve ser usado para inferir códigos fiscais. Quando termos relacionados forem incorretos ou resultarem em ruído, remova a expansão e documente o motivo.
