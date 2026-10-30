self.addEventListener("push", (event) => {
  event.waitUntil(self.registration.showNotification("Nova mensagem", {
    body: "Abra o Nortesys KB para consultar a conversa."
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/chat"));
});
