# Proyecto Final — React + Flask + Supabase

Aplicación web con frontend en React (Vite), backend en Python (Flask, desplegado
como funciones serverless) y Supabase como Auth + base de datos + storage.
Incluye autenticación por email/contraseña y Google OAuth.

## Estructura

```
proyecto-final/
├── api/
│   ├── index.py          # Backend Flask (endpoints /api/...)
│   └── requirements.txt
├── src/
│   ├── pages/Login.jsx
│   ├── pages/Dashboard.jsx
│   ├── components/ProtectedRoute.jsx
│   ├── AuthContext.jsx
│   ├── supabaseClient.js
│   ├── App.jsx
│   └── main.jsx
├── vercel.json
├── package.json
└── supabase_setup.sql
```

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea un nuevo proyecto.
2. En **Project Settings → API** copia:
   - `Project URL` → será `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon public key` → será `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase_setup.sql` para crear
   la tabla de ejemplo `items` con Row Level Security ya configurado.

## 2. Habilitar autenticación con Google

1. En Supabase: **Authentication → Providers → Google** → actívalo.
2. En Google Cloud Console, crea credenciales OAuth 2.0 (tipo "Aplicación web").
3. En **Authorized redirect URIs** agrega la URL de callback que te muestra
   Supabase en esa misma pantalla (algo como
   `https://TU-PROYECTO.supabase.co/auth/v1/callback`).
4. Copia el Client ID y Client Secret de Google y pégalos en el panel de
   Supabase, en la misma pantalla del proveedor Google.
5. En **Authentication → URL Configuration**, agrega la URL de tu app
   (`http://localhost:5173` en desarrollo y tu dominio de Vercel en
   producción) a "Redirect URLs".

## 3. Configurar variables de entorno

**Frontend** — copia `.env.example` a `.env` y completa los valores:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

**Backend** — copia `api/.env.example` a `api/.env` (solo para desarrollo
local; en producción estas variables se configuran en Vercel, ver paso 5):
```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-publica
```

## 4. Ejecutar en local

**Backend (Flask)** — en una terminal:
```bash
cd api
python -m venv venv
source venv/bin/activate      # en Windows: venv\Scripts\activate
pip install -r requirements.txt
export $(cat .env | xargs)    # o carga las variables manualmente en Windows
flask --app index run --port 5000
```

**Frontend (React)** — en otra terminal, desde la raíz del proyecto:
```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Las peticiones a `/api/...` se redirigen
automáticamente al Flask local gracias al proxy configurado en
`vite.config.js`.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En https://vercel.com, click en **Add New → Project** e importa el
   repositorio.
3. Vercel detecta automáticamente el frontend (Vite) y las funciones Python
   dentro de `/api` gracias a `requirements.txt` y `vercel.json`. No necesitas
   cambiar el "Build Command" ni el "Output Directory" por defecto.
4. En **Settings → Environment Variables** agrega, para los entornos
   Production y Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   (los dos primeros los usa el build del frontend, los dos últimos las
   funciones Flask en `/api`).
5. Click en **Deploy**.
6. Una vez desplegado, vuelve a Supabase → **Authentication → URL
   Configuration** y agrega la URL final de Vercel (por ejemplo
   `https://tu-proyecto.vercel.app`) a "Site URL" y "Redirect URLs", para que
   el login con Google funcione en producción.

## Endpoints del backend

| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| GET | `/api/health` | No | Verifica que el backend responde |
| GET | `/api/profile` | Sí | Devuelve el id y email del usuario autenticado |
| GET | `/api/items` | Sí | Lista los elementos del usuario autenticado |
| POST | `/api/items` | Sí | Crea un elemento (`{ "title": "..." }`) para el usuario autenticado |

La protección se hace validando el JWT (header `Authorization: Bearer <token>`)
contra Supabase Auth en cada request; las consultas a la tabla `items` se
hacen con ese mismo token para que las políticas de Row Level Security
filtren automáticamente por usuario.
