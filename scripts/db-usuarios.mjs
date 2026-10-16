#!/usr/bin/env node
/** Administração por CLI local: NUNCA adicione endpoints públicos de criação de conta. */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { resolve } from "node:path";

const [acao, usuarioEntrada, ...resto] = process.argv.slice(2);
const url = process.env.DATABASE_URL;
function erro(texto) { console.error(`Erro: ${texto}`); process.exit(1); }
if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) erro("DATABASE_URL não configurada em .env.local.");
const sql = neon(url);
const q = (texto, parametros = []) => sql.query(texto, parametros);
const padraoUsuario = /^[a-z][a-z0-9._-]{2,39}$/;
const papeis = ["administrador", "editor", "leitor"];
function senhaNova() { return randomBytes(24).toString("base64url"); }
function gerarHash(senha) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, Buffer.from(salt,"hex"), 64, {N:1<<14,r:8,p:1,maxmem:64*1024*1024}).toString("hex");
  return {salt,hash};
}
async function migrar() {
  let total = 0;
  for (const arquivo of ["db/001_auth.sql", "db/002_painel.sql"]) {
    const bruto = readFileSync(resolve(arquivo), "utf8");
    const semComentarios = bruto.split("\n").filter(x=>!x.trim().startsWith("--")).join("\n");
    const statements = semComentarios.split(/;\s*(?:\n|$)/).map(x=>x.trim()).filter(Boolean);
    for (const statement of statements) await q(statement);
    total += statements.length;
    console.log(`Aplicado: ${arquivo} (${statements.length} instruções).`);
  }
  console.log(`Migração idempotente concluída: ${total} instruções. Registros anteriores preservados.`);
}
async function verificar() {
  const linhas = await q("SELECT count(*)::int AS total FROM kb_usuarios");
  const artigos=await q("SELECT COUNT(*)::int AS total FROM kb_artigos");
  console.log(`PostgreSQL disponível. Usuários: ${linhas[0].total}. Artigos no banco: ${artigos[0].total}.`);
}
async function guardarPeloMenosUmAdmin(usuario, tipo) {
  const r = await q(`SELECT papel, ativo FROM kb_usuarios WHERE usuario = $1`, [usuario]);
  if (!r.length) erro("Conta não encontrada.");
  if (r[0].papel === "administrador" && r[0].ativo && tipo !== "senha") {
    const admins = await q("SELECT count(*)::int AS total FROM kb_usuarios WHERE papel = 'administrador' AND ativo = true");
    if (admins[0].total <= 1) erro("Não é permitido remover, desativar nem rebaixar o último administrador ativo.");
  }
  return r[0];
}
async function executar() {
  if (acao === "migrar") return migrar();
  if (acao === "verificar") return verificar();
  if (acao === "limpar") {
    await q("DELETE FROM kb_sessoes WHERE expira_em <= NOW()");
    await q("DELETE FROM kb_login_tentativas WHERE expira_em <= NOW()");
    console.log("Sessões e contadores expirados removidos."); return;
  }
  if (acao === "listar") {
    const r = await q("SELECT usuario, nome, papel, ativo FROM kb_usuarios ORDER BY usuario");
    if (r.length === 0) console.log("Não há usuários. Crie um administrador com usuario:adicionar.");
    for (const u of r) console.log(`${u.usuario} — ${u.nome} (${u.papel}) — ${u.ativo ? "ativo" : "inativo"}`);
    return;
  }
  if (acao === "importar") {
    // Backward compatibility: reusa scrypt da Fase 5 sem expor senhas; não substitui contas já migradas.
    const bruto = process.env.KB_USERS;
    if (!bruto) erro("KB_USERS não encontrado no .env.local. Não há contas antigas para importar.");
    let contas;
    try { contas = JSON.parse(bruto); } catch { erro("KB_USERS não contém JSON válido."); }
    if (!Array.isArray(contas) || contas.length > 30) erro("Lista de usuários antiga inválida.");
    let importadas = 0;
    for (const u of contas) {
      if (!u || !padraoUsuario.test(u.usuario) || typeof u.nome!=="string" || !/^[0-9a-f]{32}$/.test(u.salt) || !/^[0-9a-f]{128}$/.test(u.hash)) erro("Cadastro antigo inválido. Migração cancelada; confira antes de repetir.");
    }
    for (const u of contas) {
      const inseridos = await q(`INSERT INTO kb_usuarios(usuario,nome,papel,senha_salt,senha_hash)
        VALUES ($1,$2,'leitor',$3,$4) ON CONFLICT (usuario) DO NOTHING RETURNING id`,
        [u.usuario,u.nome,u.salt,u.hash]);
      if (inseridos.length) importadas++;
    }
    console.log(`${importadas} conta(s) importada(s) como leitor. Contas já existentes foram preservadas.`);
    console.log("Depois de conferir o acesso, remova KB_USERS do .env.local e da Vercel."); return;
  }
  const usuario = (usuarioEntrada ?? "").toLowerCase();
  if (!padraoUsuario.test(usuario)) erro("Usuário inválido: use 3-40 caracteres, começando com a-z e letras minúsculas/números/ponto/-/_.");
  if (acao === "adicionar") {
    if (resto.length < 2) erro('Uso: npm run usuario:adicionar -- joao "João Silva" leitor');
    const papel = resto.at(-1);
    const nome = resto.slice(0,-1).join(" ").trim();
    if (!papeis.includes(papel)) erro("Informe papel: administrador, editor ou leitor.");
    if (!/^[\p{L}\p{M}\s.-]{2,80}$/u.test(nome)) erro("Nome inválido (2 a 80 caracteres, letras e espaços).");
    const senha = senhaNova(); const {salt,hash} = gerarHash(senha);
    await q(`INSERT INTO kb_usuarios(usuario,nome,papel,senha_salt,senha_hash)
      VALUES ($1,$2,$3,$4,$5)`, [usuario,nome,papel,salt,hash]);
    console.log(`Conta criada: ${usuario} (${papel})\nSenha inicial (exibida apenas agora): ${senha}`); return;
  }
  if (acao === "senha") {
    const senha = senhaNova(); const {salt,hash} = gerarHash(senha);
    const r = await q(`UPDATE kb_usuarios SET senha_salt=$2, senha_hash=$3,
      versao_sessao=versao_sessao+1, atualizado_em=NOW()
      WHERE usuario=$1 RETURNING usuario`, [usuario,salt,hash]);
    if (!r.length) erro("Conta não encontrada.");
    console.log(`Senha redefinida: ${usuario}\nNova senha (exibida apenas agora): ${senha}\nSessões anteriores revogadas imediatamente.`); return;
  }
  if (acao === "papel") {
    const novo = resto[0]; if (!papeis.includes(novo)) erro("Papel inválido.");
    if (novo !== "administrador") await guardarPeloMenosUmAdmin(usuario, "rebaixar");
    else { const encontrado = await q("SELECT id FROM kb_usuarios WHERE usuario=$1", [usuario]); if (!encontrado.length) erro("Conta não encontrada."); }
    await q(`UPDATE kb_usuarios SET papel=$2, atualizado_em=NOW() WHERE usuario=$1`, [usuario,novo]);
    console.log(`${usuario} recebeu o papel ${novo}.`); return;
  }
  if (acao === "remover" || acao === "desativar" || acao === "ativar") {
    if (acao !== "ativar") await guardarPeloMenosUmAdmin(usuario,"remover");
    if (acao === "remover") await q("DELETE FROM kb_usuarios WHERE usuario=$1", [usuario]);
    else {
      const r=await q(`UPDATE kb_usuarios SET ativo=$2, versao_sessao=versao_sessao+1,
        atualizado_em=NOW() WHERE usuario=$1 RETURNING usuario`, [usuario,acao === "ativar"]);
      if (!r.length) erro("Conta não encontrada.");
    }
    console.log(`Conta ${usuario}: operação ${acao} concluída. Sessões antigas inválidas.`); return;
  }
  console.log(`Comandos disponíveis:
  npm run db:migrar | db:verificar | db:limpar
  npm run usuario:adicionar -- admin "Administrador" administrador
  npm run usuario:listar
  npm run usuario:senha -- admin
  npm run usuario:papel -- joao editor
  npm run usuario:desativar -- joao
  npm run usuario:ativar -- joao
  npm run usuario:remover -- joao
  npm run usuario:migrar   (se houver KB_USERS antigo)`);
}
try { await executar(); }
catch (e) {
  if (e?.code === "23505") erro("Esse usuário já existe. Use usuario:senha para redefinir a senha.");
  console.error("Operação não concluída. Confira DATABASE_URL, conectividade e a migração. Código:", e?.code ?? "indisponível");
  process.exitCode = 1;
}
