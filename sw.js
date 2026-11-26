'use strict';
// Service worker: guarda os arquivos do app para abrir sem internet. Subir o número do cache a cada versão.
const CACHE = 'dudoo-parties-v4';
const ARQUIVOS = ['./', 'index.html', 'styles.css?v=0.4.0', 'manifest.webmanifest', 'icons/icon.svg',
  'js/util.js?v=0.4.0', 'js/store.js?v=0.4.0', 'js/modelos.js?v=0.4.0', 'js/logica.js?v=0.4.0', 'js/ui.js?v=0.4.0', 'js/github.js?v=0.4.0', 'js/nuvem.js?v=0.4.0',
  'js/telas_a.js?v=0.4.0', 'js/telas_b.js?v=0.4.0', 'js/telas_c.js?v=0.4.0', 'js/demo.js?v=0.4.0', 'js/app.js?v=0.4.0'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;   // a API da nuvem nunca vem do cache
  e.respondWith(caches.match(e.request, { ignoreSearch: false }).then((r) => r || fetch(e.request).then((net) => { const copia = net.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return net; }).catch(() => caches.match('index.html'))));
});
