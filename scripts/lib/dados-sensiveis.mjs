import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ANALISAVEIS = new Set([".md", ".mdx", ".txt", ".csv", ".sql", ".xml", ".yaml", ".yml", ".json", ".html", ".svg", ".ts", ".tsx", ".js", ".mjs", ".css", ".env"]);
const IGNORADOS = new Set([".git", ".next", "node_modules", ".vercel", "out", "build", "coverage", ".idea", ".vscode"]);
const ARQUIVOS_IGNORADOS = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "dados-sensiveis.mjs"]);

function ipPublico(ip) {
  const blocos = ip.split(".").map(Number);
  if (blocos.length !== 4 || blocos.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = blocos;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

export function detectarDadosSensiveis(texto) {
  const achados = [];
  const marcar = (tipo, inicio) => { if (!achados.some(x => x.tipo === tipo && x.inicio === inicio)) achados.push({ tipo, inicio }); };
  const detectar = (tipo, regex, filtro = () => true) => {
    for (const m of texto.matchAll(regex)) if (filtro(m[0])) marcar(tipo, m.index);
  };
  detectar("CPF", /(?<!\d)\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[-.\s]?\d{2}(?!\d)/g);
  detectar("CNPJ", /(?<!\d)\d{2}[.\s-]?\d{3}[.\s-]?\d{3}[\/\s-]?\d{4}[-.\s]?\d{2}(?!\d)/g);
  detectar("e-mail", /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  detectar("IP público", /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g, ipPublico);
  detectar("segredo/tokens", /(?:ghp_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g);
  detectar("campo senha", /\bsenha\s*:/gi);
  detectar("campo password", /\bpassword\s*=/gi);
  // Padrões comuns de segredos escritos no próprio material de suporte.
  detectar("chave/token", /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|private[_-]?key)\s*[:=]\s*["']?[a-z0-9._-]{12,}/gi);
  return achados;
}

export function listarOcorrencias(raiz, dir = raiz) {
  const resultados = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORADOS.has(entrada.name) || entrada.name.startsWith(".env.")) continue;
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) { resultados.push(...listarOcorrencias(raiz, caminho)); continue; }
    if (!entrada.isFile() || ARQUIVOS_IGNORADOS.has(entrada.name)) continue;
    if (!ANALISAVEIS.has(extname(entrada.name)) && entrada.name !== ".env.example") continue;
    if (statSync(caminho).size > 1024 * 1024) continue;
    const rel = relative(raiz, caminho).replaceAll("\\", "/");
    const linhas = readFileSync(caminho, "utf8").split(/\r?\n/);
    for (const [indice, linha] of linhas.entries()) {
      for (const achado of detectarDadosSensiveis(linha)) resultados.push({ arquivo: rel, linha: indice + 1, tipo: achado.tipo });
    }
  }
  return resultados;
}
