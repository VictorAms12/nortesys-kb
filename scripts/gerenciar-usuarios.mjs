#!/usr/bin/env node
/** Gerencia cadastros de testes sem colocar senhas nem hashes no repositório. */
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env.local");
const [acao, entradaUsuario, ...partesNome] = process.argv.slice(2);
const identificador = /^[a-z][a-z0-9._-]{2,39}$/;

function erro(mensagem) { console.error(`Erro: ${mensagem}`); process.exit(1); }
function lerLinhas() {
  if (!existsSync(envPath)) erro("Crie .env.local a partir de .env.example antes de cadastrar contas.");
  return readFileSync(envPath, "utf8");
}
function valorAmbiente(linhas) {
  const linha = linhas.split(/\r?\n/).find((l) => /^KB_USERS\s*=/.test(l));
  if (!linha) return "";
  const valor = linha.slice(linha.indexOf("=") + 1).trim();
  if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) return valor.slice(1, -1);
  return valor;
}
function lerCadastro(linhas) {
  const bruto = valorAmbiente(linhas);
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista) || !lista.every(u => u && typeof u.usuario === "string" && typeof u.nome === "string" && /^[a-f0-9]{32}$/.test(u.salt) && /^[a-f0-9]{128}$/.test(u.hash))) throw new Error("Formato inválido");
    return lista;
  } catch { erro("KB_USERS contém um JSON inválido; não será sobrescrito."); }
}
function gravarCadastro(original, usuarios) {
  // Os valores usados no JSON são validados antes da escrita.
  const novo = `KB_USERS='${JSON.stringify(usuarios)}'`;
  const texto = /^KB_USERS\s*=.*$/m.test(original)
    ? original.replace(/^KB_USERS\s*=.*$/m, novo)
    : `${original.trimEnd()}\n${novo}\n`;
  writeFileSync(envPath, texto, { encoding: "utf8", mode: 0o600 });
}
function senhaNova() { return randomBytes(24).toString("base64url"); }
function criarHash(senha) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, Buffer.from(salt, "hex"), 64, { N: 1 << 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex");
  return { salt, hash };
}

if (!["adicionar", "listar", "senha", "remover"].includes(acao)) {
  console.log("Uso:\n  npm run usuario:adicionar -- ana \"Ana Silva\"\n  npm run usuario:listar\n  npm run usuario:senha -- ana\n  npm run usuario:remover -- ana");
  process.exit(1);
}
const texto = lerLinhas();
const usuarios = lerCadastro(texto);
if (acao === "listar") {
  if (usuarios.length === 0) console.log("Nenhum usuário cadastrado.");
  else for (const u of usuarios) console.log(`- ${u.usuario}: ${u.nome}`);
  process.exit(0);
}
const usuario = (entradaUsuario ?? "").toLowerCase();
if (!identificador.test(usuario)) erro("O usuário deve ter de 3 a 40 caracteres, começar com letra e usar apenas a-z, 0-9, ponto, hífen ou sublinhado.");
const indice = usuarios.findIndex(u => u.usuario === usuario);
if (acao === "adicionar") {
  const nome = partesNome.join(" ").trim();
  if (!/^[\p{L}\p{M}\s.-]{2,80}$/u.test(nome)) erro("Informe um nome de 2 a 80 caracteres (letras, espaço, ponto e hífen).");
  if (indice !== -1) erro("Esse usuário já existe. Use usuario:senha para redefinir a senha.");
  if (usuarios.length >= 30) erro("Limite de 30 contas de teste alcançado.");
  const senha = senhaNova();
  usuarios.push({ usuario, nome, ...criarHash(senha) });
  gravarCadastro(texto, usuarios);
  console.log(`Conta criada: ${usuario} (${nome})\nSenha temporária (exibida somente agora): ${senha}`);
} else if (acao === "senha") {
  if (indice === -1) erro("Usuário não encontrado.");
  const senha = senhaNova();
  Object.assign(usuarios[indice], criarHash(senha));
  gravarCadastro(texto, usuarios);
  console.log(`Senha alterada: ${usuario}\nNova senha (exibida somente agora): ${senha}\nSessões anteriores dessa conta deixarão de valer após atualizar o ambiente.`);
} else if (acao === "remover") {
  if (indice === -1) erro("Usuário não encontrado.");
  if (usuarios.length === 1) erro("Não é possível remover a última conta. Adicione outra antes.");
  usuarios.splice(indice, 1);
  gravarCadastro(texto, usuarios);
  console.log(`Conta removida: ${usuario}. As sessões dessa conta deixarão de valer após atualizar o ambiente.`);
}
console.log("Cadastros gravados apenas em .env.local (fora do Git). Na Vercel, atualize KB_USERS e crie novo deploy.");
