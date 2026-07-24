// Service Worker de MiniMarket.
// Objetivo: que la app (el "shell": HTML, manifest, íconos, fuentes, el SDK de
// Supabase) cargue instantáneamente y también SIN internet. Los datos en sí
// (productos, ventas, clientes, abonos) NO pasan por aquí — viven en
// localStorage y se sincronizan aparte, desde el propio index.html.

const CACHE_NAME = 'minimarket-shell-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Las llamadas a Supabase NUNCA se cachean: deben ir siempre a la red.
  // Si no hay internet, fallan y la app ya maneja ese caso mostrando "sin conexión".
  if (url.hostname.endsWith('.supabase.co')) return;

  // Estrategia: cache-first para el shell (carga instantánea y offline),
  // con actualización en segundo plano cuando hay red disponible.
  event.respondWith(
    caches.match(req).then((cached) => {
      const enRed = fetch(req).then((resp) => {
        // resp.ok es false en respuestas "opacas" (recursos cross-origin sin
        // CORS, como Google Fonts o el SDK de Supabase cargado por <script>),
        // pero igual queremos cachearlas para que funcionen offline.
        if (resp && (resp.ok || resp.type === 'opaque')) {
          const copia = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia));
        }
        return resp;
      }).catch(() => cached);

      return cached || enRed;
    })
  );
});
