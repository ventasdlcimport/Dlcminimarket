# MiniMarket — Supabase + PWA offline

## 1. Crear las tablas en Supabase
1. Entra a tu proyecto en supabase.com → **SQL Editor** → **New query**.
2. Pega todo el contenido de `supabase-setup.sql` y dale **Run**.
3. Deberías ver 4 tablas nuevas: `productos`, `clientes`, `ventas`, `abonos`.

Las credenciales (URL + anon key) que me diste ya están puestas dentro de
`index.html`, en la sección `SINCRONIZACIÓN CON SUPABASE`. No necesitas tocar
nada más para que funcione.

## 2. Subir los 4 archivos juntos
Sube esta carpeta completa (no solo el `.html`) a donde vayas a alojar la app:

```
index.html
manifest.json
sw.js
icons/icon-192.png
icons/icon-512.png
icons/icon-maskable-192.png
icons/icon-maskable-512.png
```

**Importante:** el Service Worker (lo que da soporte offline y hace la app
instalable) **solo funciona sobre HTTPS** (o en `localhost` para pruebas).
Si abres el `index.html` directamente desde tu computadora con doble clic
(`file://`), el service worker no se registra y no habrá modo offline ni
botón de "Instalar". Debe servirse desde un servidor web real: Netlify,
Vercel, GitHub Pages, Cloudflare Pages, o tu propio hosting, todos gratis
para esto.

Para probar en tu compu antes de subirlo:
```bash
cd minimarket
python3 -m http.server 8000
# abre http://localhost:8000 en el navegador
```

## 3. Cómo funciona la sincronización
- Todo se sigue guardando primero en `localStorage`, igual que antes — la
  app nunca espera a internet para responder.
- Cada ~25 segundos, y también apenas detecta que volvió la conexión, la
  app sube lo que cambió localmente y baja lo que haya cambiado en Supabase
  desde otros dispositivos, fusionando ambos lados.
- Si dos dispositivos editaron lo mismo estando offline, gana el cambio más
  reciente (por hora del servidor).
- Verás un indicador chiquito junto al botón "⚙ Admin":
  - **☁️ Sincronizado** — todo al día
  - **🔄 Sincronizando…** — subiendo/bajando cambios
  - **📴 Sin conexión** — trabajando en modo local
  - **⚠️ Error de sincronización** — revisa la consola del navegador (F12)

## 4. Cómo probar que quedó offline
1. Abre la app en Chrome, con conexión, deja que sincronice una vez (☁️
   Sincronizado).
2. Abre las herramientas de desarrollador (F12) → pestaña **Application** →
   **Service Workers** → confirma que aparece registrado y "activated".
3. En la misma pestaña, marca la casilla **Offline** (o apaga el wifi).
4. Recarga la página — debe seguir cargando y funcionando normalmente:
   agregar productos al carrito, cobrar, ver el historial, etc.
5. Vuelve a marcar **online** — el indicador debe pasar a "Sincronizando…"
   y luego a "☁️ Sincronizado" solo, sin que hagas nada.

## 5. Instalar como app
Con HTTPS activo, el navegador (Chrome/Edge en escritorio o Android, Safari
en iPhone vía "Compartir → Agregar a inicio") ofrecerá instalar MiniMarket
como una app con su propio ícono, sin barra de direcciones.

## Nota sobre seguridad
Las políticas de Supabase (`supabase-setup.sql`) dejan la tabla abierta a la
`anon key` porque la app sigue usando su propio sistema de contraseñas
(Admin / Dashboard) en vez de un login de Supabase. Esto es normal para una
app interna de un solo negocio, pero cualquiera que obtenga tu anon key
podría leer o escribir esas tablas directamente. Si en algún momento quieres
cerrarlo con autenticación real de Supabase, dímelo y lo ajustamos.
