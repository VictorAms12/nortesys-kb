# Contribuição com a base

Nesta fase, mantenha artigos em `content/` como Markdown, seguindo os padrões das fases anteriores. Não inclua capturas contendo informações pessoais ou dados reais de clientes. Antes de enviar alterações, execute `npm run verificar:fase55`.

As contas são gerenciadas pelo administrador via CLI contra o banco privado. Nunca adicione `DATABASE_URL`, `.env.local`, cookies ou senhas ao repositório. Rotas futuras de edição deverão aplicar `exigirPapel` no servidor antes de modificar conteúdos.
