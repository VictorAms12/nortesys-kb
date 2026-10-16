# Fase 5 — Complemento: contas individuais para os colegas

## Objetivo

Substituir o login coletivo `KB_PASSWORD` por contas individuais de teste, mantendo a estrutura do Next.js 16, sem cadastro público e sem depender de um banco de dados neste momento.

## Alterações

- Tela `/entrar` com campos **Usuário** e **Senha**.
- Cadastro privado em `KB_USERS` (JSON contendo `usuario`, `nome`, `salt` e `hash`). O hash é produzido com scrypt e um salt aleatório exclusivo por pessoa.
- Sessão versionada v2, que contém o identificador do usuário e é assinada no servidor. A assinatura fica vinculada ao hash atual da pessoa: redefinir a senha ou excluir a conta invalida suas sessões quando o ambiente é atualizado.
- Nome do usuário exibido no cabeçalho; opção Sair mantida.
- Limite básico de cinco tentativas por nome de usuário e sessenta globais a cada 15 minutos **por instância**. Não é um mecanismo distribuído.
- CLI privada para incluir, listar, redefinir e excluir contas; testes automatizados de isolamento, expiração, remoção e troca de senha.

## Migração a partir da Fase 5 com senha compartilhada

1. Copie os arquivos da atualização na raiz da Fase 5 mais recente.
2. **Preserve** seu `.env.local` e `KB_SESSION_SECRET`, nunca apague seu segredo por engano.
3. Adicione `KB_USERS=` ao `.env.local` (pode começar vazio).
4. Crie primeiro uma conta para você, depois para os colegas, com `usuario:adicionar`.
5. Remova `KB_PASSWORD` após confirmar que todos conseguem entrar com as próprias contas. Sessões antigas v1 não serão aceitas.
6. Reinicie `npm run dev` e valide `/entrar`. Se faltar uma variável, a própria página sinalizará configuração incompleta.

Exemplos Windows PowerShell:

```powershell
npm.cmd run usuario:adicionar -- victor "Victor"
npm.cmd run usuario:adicionar -- colega01 "Colega Teste"
npm.cmd run usuario:listar
npm.cmd run usuario:senha -- colega01
npm.cmd run usuario:remover -- colega01
```

A senha gerada é exibida **somente no instante da criação ou redefinição**. Não é possível recuperar uma senha anterior, apenas criar outra. Repasse as credenciais individualmente, nunca pelo repositório.

## Para usar na Vercel

1. Suba apenas o código para um repositório privado no GitHub; confira `git status` para garantir que `.env.local` não está versionado.
2. Na Vercel, crie as variáveis privadas `KB_USERS` e `KB_SESSION_SECRET` em Preview (e em Production se for usar esse ambiente). O valor de `KB_USERS` é o JSON inteiro de uma única linha, sem as aspas externas de `.env.local`.
3. Faça novo deploy após cada criação, remoção ou redefinição de conta; alterar somente o `.env.local` no computador não atualiza a Vercel.
4. Ative proteção do ambiente Preview pela Vercel e confirme que o site não contém conteúdo real de clientes.
5. Teste cada login em sessão anônima, e teste acesso sem login, logout e retorno aos artigos.

## Limites

A configuração em variável de ambiente não substitui um serviço de identidade. Os administradores ainda precisam distribuir senhas manualmente, não há recuperação automática, nem MFA, nem sessões armazenadas centralmente. Em caso de muitos colaboradores ou requisitos corporativos, migre para provedor de autenticação (SSO / Entra ID / Auth0 / Supabase Auth) e política de permissão auditável. Habilite proteção de taxa distribuída antes de disponibilizar o sistema à internet sem barreiras adicionais.
