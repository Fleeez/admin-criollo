# Instrucciones para agentes AI

## Archivos PROTEGIDOS — no modificar

Estos archivos contienen configuración de infraestructura crítica. Cualquier cambio puede romper el routing en producción (Vercel) o la autenticación de Supabase:

- `vercel.json` — reglas de routing SPA, NO cambiar el rewrite `/(.*)`
- `src/lib/supabaseClient.js` — inicialización del cliente Supabase, NO agregar `throw` ni cambiar el `createClient`
- `src/main.jsx` — lógica de sesión y routing de auth, NO modificar el triple estado de `/login`

## Archivos LIBRES para editar

Todo lo que esté en estas rutas es seguro para trabajar:

- `src/pages/` — páginas de la app
- `src/components/` — componentes UI
- `src/App.jsx` — layout y tabs del panel
- `src/index.css` — estilos globales
- `src/mockData.js` — datos de prueba
- `public/` — assets estáticos
