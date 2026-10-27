self.addEventListener("push", (event) => {
  event.waitUntil(self.registration.showNotification("Nova mensagem", {
    body: "Abra o Nortesys KB para consultar a conversa."
  }));
});