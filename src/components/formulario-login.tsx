"use client";

import { useEffect, useState } from "react";
import { IconeInterface } from "./icone-interface";

type Props = {
  pronta: boolean;
  retorno: string;
  credenciaisInvalidas: boolean;
};

export function FormularioLogin({ pronta, retorno, credenciaisInvalidas }: Props) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    const restaurar = () => setEnviando(false);
    window.addEventListener("pageshow", restaurar);
    return () => window.removeEventListener("pageshow", restaurar);
  }, []);

  return (
    <form action="/api/autenticacao/entrar" method="post" className="login-form" onSubmit={() => setEnviando(true)}>
      <input type="hidden" name="retorno" value={retorno} />
      <div className="login-field">
        <label htmlFor="usuario">Nome de usuário</label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={40}
          pattern="[a-z][a-z0-9._-]{2,39}"
          placeholder="Digite seu usuário"
          aria-invalid={credenciaisInvalidas || undefined}
          aria-describedby={credenciaisInvalidas ? "login-alerta" : "dica-usuario"}
          required
          disabled={!pronta}
          readOnly={enviando}
        />
        <p className="login-field-hint" id="dica-usuario">Utilize o usuário fornecido pelo administrador.</p>
      </div>

      <div className="login-field">
        <label htmlFor="senha">Senha</label>
        <div className="login-password-wrap">
          <input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            maxLength={1024}
            aria-invalid={credenciaisInvalidas || undefined}
            aria-describedby={credenciaisInvalidas ? "login-alerta" : (capsLock ? "alerta-caps" : undefined)}
            onKeyUp={e => setCapsLock(e.getModifierState("CapsLock"))}
            onKeyDown={e => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
            required
            disabled={!pronta}
            readOnly={enviando}
          />
          <button
            className="login-password-toggle"
            type="button"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            onClick={() => setMostrarSenha(estado => !estado)}
            disabled={!pronta || enviando}
          >
            {mostrarSenha ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3 21 21"/><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c5 0 9 4.5 10 7a15 15 0 0 1-3.1 4.3M6.3 6.3A15.3 15.3 0 0 0 2 12c1 2.5 5 7 10 7 1.7 0 3.3-.5 4.7-1.3"/><path d="M10 10a3 3 0 0 0 4 4"/></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        <p className="login-caps-warning" id="alerta-caps" aria-live="polite">{capsLock ? "Caps Lock está ativado." : ""}</p>
      </div>

      <button type="submit" className="login-submit" disabled={!pronta || enviando} aria-busy={enviando}>
        <span>{enviando ? "Verificando acesso..." : "Entrar na base"}</span>
        {enviando ? <span className="login-spinner" aria-hidden="true" /> : <IconeInterface nome="seta" width={19} height={19} />}
      </button>
    </form>
  );
}
