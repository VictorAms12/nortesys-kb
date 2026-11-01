# Retenção de auditoria — Nortesys KB

A tabela `kb_auditoria` registra tipo de evento, alvo técnico (UUID, caminho do artigo ou rótulo fixo), usuário quando autenticado e data. Não armazenar senha, token, cookie, Authorization nem o texto das mensagens de chat. O login falho e o bloqueio usam rótulos genéricos, sem usuário digitado nem IP. Os eventos de chat guardam identificadores de conversa, não o conteúdo.

A manutenção diária remove eventos anteriores a `AUDITORIA_RETENCAO_DIAS` (padrão 365 dias, faixa permitida 30–1825) em até cinco lotes de 200 por execução. A consulta usa o índice de data, `FOR UPDATE SKIP LOCKED` e não altera sessões, contas, artigos ou mensagens. Se houver mais de 1000 eventos antigos, o cron seguinte continua.

Revise requisitos contratuais e legais de retenção antes de mudar o período. Revisar eventos novos para garantir que o campo `alvo` é identificador técnico; não registrar parâmetros SQL nem dados privados em logs. Logs de infraestrutura Neon/Vercel têm retenção própria.

## Cobertura

Teste PGlite confirma exclusão em lotes de 200+5 itens antigos, preservando evento atual. Não foi executado cron no Neon de produção nem inspeção de logs da Vercel.
