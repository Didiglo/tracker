import os
from datetime import date, timedelta
from functools import wraps

from flask import Flask, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")


def get_public_client() -> Client:
    """Cliente Supabase sin autenticación de usuario (usa la anon key)."""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_client_with_auth(token: str) -> Client:
    """Cliente Supabase que adjunta el JWT del usuario para que
    Postgres aplique las políticas de Row Level Security correctas."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(token)
    return client


def get_token_from_request():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def require_auth(f):
    """Decorador que valida el JWT emitido por Supabase Auth contra
    el propio servicio de Supabase antes de ejecutar el endpoint."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"error": "Falta el token de autenticación"}), 401

        try:
            client = get_public_client()
            user_response = client.auth.get_user(token)
        except Exception as e:
            return jsonify({"error": "Token inválido o expirado", "debug": str(e)}), 401

        user = getattr(user_response, "user", None)
        if not user:
            return jsonify({"error": "Token inválido o expirado"}), 401

        request.user = user
        request.token = token
        return f(*args, **kwargs)

    return wrapper


def get_own_habit(client, habit_id):
    """Devuelve el hábito si existe y pertenece (según RLS) al usuario actual."""
    result = client.table("habits").select("id").eq("id", habit_id).execute()
    return result.data[0] if result.data else None


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/profile", methods=["GET"])
@require_auth
def profile():
    user = request.user
    return jsonify({"id": user.id, "email": user.email})


# ============================================================
# Hábitos (CRUD completo)
# ============================================================

@app.route("/api/habits", methods=["GET"])
@require_auth
def list_habits():
    client = get_client_with_auth(request.token)
    try:
        result = (
            client.table("habits")
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/habits", methods=["POST"])
@require_auth
def create_habit():
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "El campo 'name' es obligatorio"}), 400
    if len(name) > 80:
        return jsonify({"error": "El nombre es demasiado largo (máx. 80 caracteres)"}), 400

    try:
        target = int(body.get("target_days_per_week", 7))
    except (TypeError, ValueError):
        target = 7
    target = max(1, min(7, target))

    payload = {
        "name": name,
        "emoji": (body.get("emoji") or "⭐").strip()[:8] or "⭐",
        "color": (body.get("color") or "#7C5CFC").strip()[:9],
        "target_days_per_week": target,
        "user_id": request.user.id,
    }

    client = get_client_with_auth(request.token)
    try:
        result = client.table("habits").insert(payload).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/habits/<habit_id>", methods=["PUT"])
@require_auth
def update_habit(habit_id):
    body = request.get_json(force=True, silent=True) or {}
    updates = {}

    if "name" in body:
        name = (body.get("name") or "").strip()
        if not name:
            return jsonify({"error": "El campo 'name' no puede estar vacío"}), 400
        if len(name) > 80:
            return jsonify({"error": "El nombre es demasiado largo (máx. 80 caracteres)"}), 400
        updates["name"] = name

    if "emoji" in body:
        updates["emoji"] = (body.get("emoji") or "⭐").strip()[:8] or "⭐"

    if "color" in body:
        updates["color"] = (body.get("color") or "#7C5CFC").strip()[:9]

    if "target_days_per_week" in body:
        try:
            target = int(body.get("target_days_per_week"))
        except (TypeError, ValueError):
            return jsonify({"error": "target_days_per_week debe ser un número"}), 400
        updates["target_days_per_week"] = max(1, min(7, target))

    if not updates:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    client = get_client_with_auth(request.token)
    try:
        result = client.table("habits").update(updates).eq("id", habit_id).execute()
        if not result.data:
            return jsonify({"error": "Hábito no encontrado"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/habits/<habit_id>", methods=["DELETE"])
@require_auth
def delete_habit(habit_id):
    client = get_client_with_auth(request.token)
    try:
        result = client.table("habits").delete().eq("id", habit_id).execute()
        if not result.data:
            return jsonify({"error": "Hábito no encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# Check-ins / registros diarios (CRUD completo)
# ============================================================

@app.route("/api/logs", methods=["GET"])
@require_auth
def list_logs():
    try:
        days = int(request.args.get("days", 30))
    except ValueError:
        days = 30
    days = max(1, min(120, days))
    since = (date.today() - timedelta(days=days)).isoformat()

    client = get_client_with_auth(request.token)
    try:
        result = (
            client.table("habit_logs")
            .select("*")
            .gte("log_date", since)
            .order("log_date", desc=True)
            .execute()
        )
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/habits/<habit_id>/logs", methods=["POST"])
@require_auth
def create_log(habit_id):
    client = get_client_with_auth(request.token)

    if not get_own_habit(client, habit_id):
        return jsonify({"error": "Hábito no encontrado"}), 404

    body = request.get_json(force=True, silent=True) or {}
    log_date = (body.get("log_date") or date.today().isoformat()).strip()

    payload = {
        "habit_id": habit_id,
        "user_id": request.user.id,
        "log_date": log_date,
        "note": (body.get("note") or "").strip() or None,
    }

    try:
        result = client.table("habit_logs").insert(payload).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        message = str(e)
        if "duplicate key" in message.lower():
            return jsonify({"error": "Ese día ya estaba marcado como completado"}), 409
        return jsonify({"error": message}), 500


@app.route("/api/logs/<log_id>", methods=["PUT"])
@require_auth
def update_log(log_id):
    body = request.get_json(force=True, silent=True) or {}
    if "note" not in body:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    client = get_client_with_auth(request.token)
    try:
        result = (
            client.table("habit_logs")
            .update({"note": (body.get("note") or "").strip() or None})
            .eq("id", log_id)
            .execute()
        )
        if not result.data:
            return jsonify({"error": "Registro no encontrado"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/logs/<log_id>", methods=["DELETE"])
@require_auth
def delete_log(log_id):
    client = get_client_with_auth(request.token)
    try:
        result = client.table("habit_logs").delete().eq("id", log_id).execute()
        if not result.data:
            return jsonify({"error": "Registro no encontrado"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Vercel (runtime @vercel/python) importa este módulo y usa la variable
# "app" como aplicación WSGI. Para correr localmente: flask --app api/index run
if __name__ == "__main__":
    app.run(debug=True, port=5000)
