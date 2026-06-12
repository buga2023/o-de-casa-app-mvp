// Service worker do Ô de Casa! — instalabilidade PWA + base para Web Push.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Handler de fetch mínimo (requisito de instalabilidade). Sem cache offline
// agressivo: o app é dinâmico e o modo demo vive no localStorage.
self.addEventListener("fetch", () => {});

// Web Push (quando houver backend enviando push real — RF-05).
self.addEventListener("push", (event) => {
  let payload = { title: "Ô de Casa!", body: "Você tem uma nova notificação." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* payload não-JSON: usa o padrão */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((wins) => {
      const url = "/notificacoes";
      const aberta = wins.find((w) => "focus" in w);
      return aberta ? aberta.focus().then(() => aberta.navigate(url)) : self.clients.openWindow(url);
    })
  );
});
