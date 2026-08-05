# Rachas — Tracker de Hábitos (React + Flask + Supabase)

Aplicación web full-stack para trackear hábitos diarios: frontend en React
(Vite) con interfaz dinámica y juvenil, backend en Python (Flask, desplegado
como funciones serverless) y Supabase como Auth + base de datos relacional.
Incluye autenticación por email/contraseña (JWT) y CRUD completo sobre dos
entidades: **hábitos** y **check-ins (registros diarios)**.

## Estructura

```
tracker/
├── api/
│   ├── index.py          # Backend Flask (endpoints /api/...)
│   └── requirements.txt
├── src/
│   ├── pages/Login.jsx
│   ├── pages/Dashboard.jsx
│   ├── components/HabitCard.jsx
│   ├── components/HabitFormModal.jsx
│   ├── components/ConfirmDialog.jsx
│   ├── components/ProtectedRoute.jsx
│   ├── hooks/useHabits.js
│   ├── services/api.js          # cliente HTTP base
│   ├── services/habits.js       # llamadas a /api/habits y /api/logs
│   ├── utils/streak.js          # cálculo de rachas y progreso semanal
│   ├── AuthContext.jsx
│   ├── supabaseClient.js
│   ├── App.jsx
│   └── main.jsx
├── vercel.json
├── package.json
└── supabase_setup.sql
```

## Modelo de datos

- **habits** — hábitos que el usuario quiere trackear (`name`, `emoji`,
  `color`, `target_days_per_week`).
- **habit_logs** — check-ins: un registro por hábito y día (`log_date`,
  `note` opcional), con restricción `unique(habit_id, log_date)`.

Ambas tablas tienen Row Level Security: cada usuario solo puede ver y
modificar sus propios hábitos y registros (`auth.uid() = user_id`).

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea un nuevo proyecto.
2. En **Project Settings → API** copia:
   - `Project URL` → será `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon public key` → será `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase_setup.sql` para
   crear las tablas `habits` y `habit_logs` con Row Level Security ya
   configurado.

## 2. Configurar variables de entorno

**Frontend** — copia `.env.example` a `.env` y completa los valores:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

**Backend** — copia `api/.env.example` a `api/.env` (solo para desarrollo
local; en producción estas variables se configuran en Vercel, ver paso 4):
```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-publica
```

## 3. Ejecutar en local

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

## 4. Desplegar en Vercel

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
   `https://tu-proyecto.vercel.app`) a "Site URL" y "Redirect URLs".

## Endpoints del backend

| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| GET | `/api/health` | No | Verifica que el backend responde |
| GET | `/api/profile` | Sí | Devuelve el id y email del usuario autenticado |
| GET | `/api/habits` | Sí | Lista los hábitos del usuario autenticado |
| POST | `/api/habits` | Sí | Crea un hábito (`name`, `emoji`, `color`, `target_days_per_week`) |
| PUT | `/api/habits/:id` | Sí | Actualiza un hábito propio |
| DELETE | `/api/habits/:id` | Sí | Elimina un hábito propio (y sus registros) |
| GET | `/api/logs?days=30` | Sí | Lista los check-ins del usuario en los últimos N días |
| POST | `/api/habits/:id/logs` | Sí | Crea un check-in para ese hábito (`log_date`, `note` opcional) |
| PUT | `/api/logs/:id` | Sí | Actualiza la nota de un check-in propio |
| DELETE | `/api/logs/:id` | Sí | Elimina (desmarca) un check-in propio |

La protección se hace validando el JWT (header `Authorization: Bearer <token>`)
contra Supabase Auth en cada request; las consultas a `habits` y `habit_logs`
se hacen con ese mismo token para que las políticas de Row Level Security
filtren automáticamente por usuario.
