> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Nortesys KB — Fase 5.5: PostgreSQL e contas individuais

## O que foi entregue

- PostgreSQL (compatível com Neon), com esquema SQL idempotente em `db/001_auth.sql`.
- Contas individuais: usuário, nome, papel (`administrador`, `editor` ou `leitor`), senha scrypt e estado ativo.
- Sessões revogáveis: cookie HttpOnly, SameSite Strict, Secure em produção; token de 32 bytes aleatórios, armazenado **somente por hash SHA-256** no banco e expiração de oito horas.
- Revogação imediata de sessões quando uma conta é desativada, excluída ou tem a senha redefinida.
- Contador de tentativas de login (cinco por usuário a cada 15 minutos) no banco, compartilhado entre instâncias serverless. **Ainda é recomendável um WAF e limitação por IP** antes de uso aberto.
- API de login e logout integrada ao banco, sem cadastro público.
- CLI de administração no terminal, com geração de senha inicial aleatória e migração opcional dos hashes de `KB_USERS`.
- Papéis ficam persistidos e são consultados na sessão; funções `exigirPapel` e `papelPermitido` estão prontas para proteger rotas futuras. **Não existe painel de criação de artigos nem gestão web de usuários nesta fase.**
- Artigos continuam no diretório `content/` como Markdown. Migração de artigos e fluxos de edição será abordada na Fase 6.

## Configurar Neon (uma única vez)

1. Crie um projeto no painel Neon, escolha região próxima aos usuários.
2. Copie a connection string **com TLS habilitado**, preferencialmente a URL pooled indicada pelo serviço.
3. Em Windows PowerShell (na raiz do projeto), crie `.env.local` se ainda não tiver:

```powershell
Copy-Item .env.example .env.local
```

4. Defina `DATABASE_URL` na `.env.local` com a connection string recebida do Neon. Não compartilhe o arquivo. Se já existir, edite-o preservando valores anteriores até concluir a migração.
5. Instale as dependências e crie as tabelas:

```powershell
npm.cmd install
npm.cmd run db:migrar
npm.cmd run db:verificar
```

> `db:migrar` cria apenas as tabelas de autenticação e pode ser repetido. Requer acesso ao PostgreSQL; não roda automaticamente durante `npm run build`.

## Criar usuários

Crie primeiro seu usuário administrador (a senha aparecerá somente uma vez no terminal):

```powershell
npm.cmd run usuario:adicionar -- admin "Administrador Nortesys" administrador
npm.cmd run usuario:adicionar -- joao "João Silva" leitor
npm.cmd run usuario:adicionar -- maria "Maria Silva" editor
npm.cmd run usuario:listar
```

Outros comandos:

```powershell
npm.cmd run usuario:senha -- joao
npm.cmd run usuario:papel -- joao editor
npm.cmd run usuario:desativar -- joao
npm.cmd run usuario:ativar -- joao
npm.cmd run usuario:remover -- joao
npm.cmd run db:limpar
```

- `usuario:senha` gera nova senha e revoga sessões anteriores imediatamente.
- `usuario:desativar` impede novos logins e revoga sessões, sem apagar o registro.
- `usuario:remover` exclui permanentemente a conta; execute apenas quando necessário.
- O CLI impede remover, desativar ou rebaixar o último administrador ativo em uso normal (não execute SQL manual para contornar isso).
- O `db:limpar` remove sessões e contadores de tentativas expirados. Execute periodicamente para evitar acúmulo de registros.
- O CLI só deve ser executado por quem administra o banco. A URL do banco confere acesso de escrita, então não compartilhe nem a adicione ao Git.

## Migrar contas existentes da Fase 5

Se você já cadastrou usuários na versão que usava `KB_USERS`:

1. Antes de mexer em `KB_USERS`, faça backup local seguro do `.env.local` (não faça commit, não envie por chat).
2. Configure `DATABASE_URL`, execute `npm run db:migrar`.
3. Mantenha `KB_USERS` na `.env.local` por um momento e execute:

```powershell
npm.cmd run usuario:migrar
npm.cmd run usuario:listar
```

4. A migração copia os hashes scrypt sem revelar a senha original e **não sobrescreve contas já existentes**. Contas importadas começam como `leitor`.
5. Crie um administrador novo ou promova uma conta importada:

```powershell
npm.cmd run usuario:papel -- admin administrador
```

6. Teste o login com a senha antiga. Após validar, remova `KB_USERS` do `.env.local` e das variáveis da Vercel (se configuradas).
7. O antigo `KB_SESSION_SECRET` não é mais necessário: os cookies anteriores (`v2`) não serão aceitos; todos farão novo login. Pode retirá-lo após a migração.

> **Importante:** esta migração não modifica os artigos Markdown nem apaga o banco. A alteração de senha deve ser feita apenas no novo CLI após a migração.

## Como validar no VS Code

```powershell
npm.cmd run verificar:estrutura
npm.cmd run verificar
npm.cmd run testar:validacao
npm.cmd run testar:busca
npm.cmd run testar:seguranca
npm.cmd run testar:usuarios
npm.cmd run testar:banco
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Acesse `http://localhost:3000/entrar` e teste com contas diferentes. Confira logout e que uma conta desativada não consegue voltar à página protegida. Os testes locais **não substituem** a homologação no banco real.

## Publicar em Vercel

1. Use repositório GitHub **privado** com os arquivos deste projeto; não inclua `.env.local` e `node_modules`.
2. No painel da Vercel, importe como projeto Next.js e defina `DATABASE_URL` como Environment Variable privada para **Preview** e/ou **Production**, conforme o uso.
3. Antes de publicar, rode `db:migrar` e cadastre os usuários **a partir do seu computador**, com `.env.local` apontando para o banco Neon correto. Evite vincular seu banco de produção a previews de pessoas não autorizadas.
4. Rode o build local e crie Preview protegido com Vercel Authentication. Ative proteções adicionais (WAF, monitoramento de tentativas, backups/retenção) antes de dados internos reais.
5. Revogue eventuais credenciais de conexão expostas acidentalmente; não logue tokens nem credenciais.

**Atenção:** a conexão do banco real e o build integral devem ser testados por você. Este pacote foi produzido sem credenciais de Neon e sem instalar todas as dependências por restrição do ambiente de geração.

## Controle de permissões

| Papel | Fase 5.5 | Planejado para Fase 6 |
| --- | --- | --- |
| Administrador | Conta identificada no PostgreSQL, login individual | Gerenciamento web de contas e publicação |
| Editor | Conta identificada no PostgreSQL, login individual | Propor e editar artigos |
| Leitor | Conta identificada no PostgreSQL, login individual | Somente consultar artigos |

Como atualmente todas as páginas são de consulta, os três papéis veem as mesmas páginas. As rotas futuras de escrita deverão chamar `exigirPapel(["editor", "administrador"])` ou equivalente no servidor.
