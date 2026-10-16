---
titulo: "Cadastro de cliente duplicado no ERP"
resumo: "Como analisar a mensagem de cliente já cadastrado sem criar registros repetidos."
categoria: "cadastros"
sistema: "ERP Principal (exemplo fictício)"
tags:
  - "cadastro"
  - "cliente"
  - "duplicidade"
codigosErro:
  - "CLI-DUP-001"
nivel: "N1"
autor: "Equipe de Suporte (exemplo)"
criadoEm: "2026-10-16"
atualizadoEm: "2026-10-16"
status: "rascunho"
---

## Problema

O cliente informa: "Estou tentando cadastrar uma pessoa e o sistema diz que ela já existe."

## Sintomas e mensagem exata

Mensagem **fictícia** usada apenas para treinamento:

```text
CLI-DUP-001: Já existe um cliente com os dados informados.
```

## Causa provável

O cadastro pode ter sido realizado anteriormente, ou o operador digitou dados de outra pessoa. Não é possível afirmar qual é o caso sem consultar o registro no ERP.

## Solução passo a passo

1. Solicite que o operador verifique o cadastro, sem compartilhar documentos ou dados pessoais no artigo.
2. Abra a consulta de clientes no ambiente de treinamento.
3. Localize registros potencialmente duplicados utilizando apenas dados fictícios.
4. Confirme com o responsável pela empresa se já existe um cadastro válido.
5. Se necessário, encaminhe a correção cadastral para alguém com permissão adequada.

## Como confirmar que resolveu

Verifique se o operador consegue selecionar o cadastro correto sem criar duplicatas. Registre o resultado do teste no chamado, sem copiar informações pessoais para a base de conhecimento.

## Se não resolver: quando e para quem escalar

Encaminhe ao N2 quando a mensagem persistir após a conferência. Registre versão do ERP, caminho da tela, horário, texto exato do erro e evidências **com os dados pessoais ocultos**.

## Artigos relacionados

Nenhum artigo relacionado foi publicado nesta fase. Os links internos serão implementados na Fase 3.
