/** Perfil compartilhado entre componentes na mesma aba, sem armazenamento persistente. */
export type PerfilCompartilhado = {
  id: string;
  avatarCaminho: string | null;
  preferencias?: { avisos: boolean; navegador: boolean; geral: boolean };
};

let valor: PerfilCompartilhado | null = null;
let consultadoEm = 0;
let pendente: Promise<PerfilCompartilhado | null> | null = null;
let geracao = 0;
const VALIDADE_MS = 60_000;

export function invalidarPerfilCompartilhado(): void {
  geracao++;
  valor = null;
  consultadoEm = 0;
  pendente = null;
}

export function obterPerfilCompartilhado(): Promise<PerfilCompartilhado | null> {
  if (consultadoEm && Date.now() - consultadoEm < VALIDADE_MS) return Promise.resolve(valor);
  if (pendente) return pendente;
  const atual = geracao;
  const chamada = fetch("/api/perfil", { cache: "no-store", credentials: "same-origin" })
    .then(async resposta => {
      if (!resposta.ok) return null;
      return await resposta.json() as PerfilCompartilhado;
    })
    .then(perfil => {
      if (atual === geracao && perfil?.id) {
        valor = perfil;
        consultadoEm = Date.now();
      }
      return perfil;
    })
    .finally(() => { if (pendente === chamada) pendente = null; });
  pendente = chamada;
  return chamada;
}
