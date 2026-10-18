"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"form">, "onSubmit" | "action"> & {
  action: string;
  mensagemEnvio?: string;
};

/** Mantém o POST nativo e todos os campos disponíveis para serialização. */
export function FormularioComFeedback({ children, mensagemEnvio = "Salvando alterações...", ...props }: Props) {
  const [enviando, setEnviando] = useState(false);
  const emEnvio = useRef(false);
  useEffect(() => {
    const restaurar = () => { emEnvio.current = false; setEnviando(false); };
    window.addEventListener("pageshow", restaurar);
    return () => window.removeEventListener("pageshow", restaurar);
  }, []);

  return <form {...props} aria-busy={enviando} data-enviando={enviando ? "sim" : undefined}
    onSubmit={evento => {
      // Confirmações canceladas e uploads em andamento já impedem o envio.
      if (evento.defaultPrevented) return;
      if (emEnvio.current) { evento.preventDefault(); return; }
      emEnvio.current = true;
      setEnviando(true);
    }}>
    {children}
    <span className="feedback-formulario" role="status" aria-live="polite">
      {enviando && <><span className="indicador-envio" aria-hidden="true" />{mensagemEnvio}</>}
    </span>
  </form>;
}
