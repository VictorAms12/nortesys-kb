> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Checklist de homologação — Fase 5 do Nortesys KB

> Checklist histórico da versão com senha compartilhada. Para a versão atual use `CHECKLIST-CONTAS-INDIVIDUAIS.md`.

**Data:** __________  **Ambiente:** __________  **Responsável:** __________

## Instalação e comandos

- [ ] `npm.cmd install` concluiu sem erros.
- [ ] `.env.local` foi criado localmente e ignorado pelo Git.
- [ ] `KB_PASSWORD` possui ao menos 12 caracteres; não foi enviado a ninguém.
- [ ] `KB_SESSION_SECRET` foi gerado aleatoriamente, não é igual à senha e não está em commit.
- [ ] `npm.cmd run verificar:estrutura` passou.
- [ ] `npm.cmd run verificar` passou.
- [ ] `npm.cmd run validar:artigos` passou.
- [ ] `npm.cmd run testar:validacao` passou.
- [ ] `npm.cmd run testar:busca` passou.
- [ ] `npm.cmd run testar:seguranca` passou.
- [ ] `npm.cmd run lint` passou.
- [ ] `npm.cmd run build` passou.

## Acesso e sessões

- [ ] `/`, `/busca`, `/categorias/...` e `/artigos/...` exigem autenticação.
- [ ] A tela `/entrar` abre sem sessão.
- [ ] Senha incorreta não permite entrada.
- [ ] Após 5 falhas, tentativa adicional é bloqueada (mesma instância).
- [ ] Senha correta libera as páginas internas.
- [ ] Busca, filtros, Ctrl+K, leitura e tema da Fase 4 foram preservados.
- [ ] Cookie não contém a senha; HttpOnly e SameSite Strict estão ativos.
- [ ] Expiração máxima do cookie é de 8 horas.
- [ ] Botão Sair encerra a sessão do navegador.
- [ ] URL externa em parâmetro de retorno não causa redirecionamento externo.

## Proteção de dados e publicação

- [ ] Scanner bloqueia padrão sensível e informa arquivo/linha.
- [ ] Arquivos Markdown e `public/` não contêm dados pessoais nem dados reais de clientes.
- [ ] `robots.txt` bloqueia indexação.
- [ ] Respostas incluem CSP, X-Frame-Options, Referrer-Policy e X-Robots-Tag.
- [ ] Repositório GitHub está **privado** (quando configurado).
- [ ] Produção planejada com HTTPS e proteção na infraestrutura.
- [ ] Limitações da senha compartilhada e do limite em memória foram aceitas.

## Resultado

- [ ] **APROVADA**, Fase 6 liberada.
- [ ] **BLOQUEADA**, corrigir antes de avançar.

**Erros observados / prints sem dados sensíveis:**

____________________________________________________________

____________________________________________________________
