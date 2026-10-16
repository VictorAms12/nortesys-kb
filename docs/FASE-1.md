# Guia de execução — Fase 1

## 1. Confirmar ferramentas

No PowerShell do Windows 11, digite:

```powershell
node --version
npm.cmd --version
git --version
```

- `node`: executa JavaScript fora do navegador. A versão deve ser >= 20.9. Recomendamos LTS 24.
- `npm`: gerenciador que instala pacotes do projeto. No Windows, `npm.cmd` evita um erro comum com a política de execução de scripts do PowerShell.
- `git`: registra histórico de alterações; ainda não precisamos enviar nada ao GitHub.

Se faltar Node.js, obtenha no site oficial `https://nodejs.org/pt-br/download/` e instale a opção LTS. Feche e abra novamente o terminal. Alternativa via Winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

Se faltar Git, instale em `https://git-scm.com/download/win`, e reabra o PowerShell.

## 2. Escolher pasta

Extraia o ZIP pelo Explorador de Arquivos para uma pasta simples, por exemplo `Documentos\Projetos`. Você deve chegar a uma pasta que contenha `package.json`.

No VS Code: `Arquivo > Abrir Pasta` e selecione `nortesys-kb-fase1`. Então `Terminal > Novo Terminal`. Confira sua pasta:

```powershell
Get-Location
Get-ChildItem
```

`Get-Location` informa a pasta atual. `Get-ChildItem` lista os arquivos; veja se existe `package.json`.

## 3. Instalar pacotes

```powershell
npm.cmd install
```

O npm lê `package.json`, baixa as bibliotecas e cria `node_modules/` e `package-lock.json`. A pasta `node_modules` é grande e está no `.gitignore`; o `package-lock.json` deve ser versionado no GitHub, pois registra versões instaladas.

## 4. Abrir o site local

```powershell
npm.cmd run dev
```

`run dev` chama `next dev`, que inicia o servidor em `http://localhost:3000`. Abra o link. Para encerrar o processo, pressione `Ctrl+C`.

## 5. Conferir o código e build

- `src/app/page.tsx`: conteúdo da página inicial.
- `src/app/layout.tsx`: estrutura comum, título e idioma do site.
- `src/app/globals.css`: Tailwind e aparência global.
- `package.json`: dependências e comandos.

Depois de interromper o servidor, rode:

```powershell
npm.cmd run verificar:estrutura
npm.cmd run lint
npm.cmd run build
```

O primeiro confere a presença de arquivos; o segundo procura problemas no código; o terceiro cria uma compilação de produção. O esperado é a rota `/` aparecer como página estática/pré-renderizada.

## Se der erro

**`node` não é reconhecido:** instale o Node LTS, feche e reabra VS Code/PowerShell, execute `node --version` de novo.

**`npm.ps1` não pode ser carregado porque a execução de scripts foi desabilitada:** use `npm.cmd install` e `npm.cmd run dev`, sem mexer na política global de segurança.

**`ENOENT ... package.json`:** você abriu o terminal na pasta errada. Use `Get-ChildItem` e entre na pasta que tem o `package.json`.

**`EADDRINUSE` ou porta 3000 ocupada:** utilize `npm.cmd run dev -- -p 3001` e acesse `http://localhost:3001`.

**Falha de rede ou certificado no `npm install`:** confira sua conexão, VPN/proxy da empresa e mensagens completas. Não desative verificação SSL para contornar um problema de certificado.

**`Module not found` ou `Cannot find module 'next'`:** rode `npm.cmd install` na raiz do projeto.

**Erro de compilação/build:** copie a mensagem completa do PowerShell, incluindo as linhas logo antes e depois do erro, e mande aqui. Corrigiremos o arquivo pontualmente.
