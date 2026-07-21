import os
from functools import wraps

from flask import Flask, request, jsonify
from supabase import create_client, Client

app = Flask(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")


@app.route("/api/debug-env", methods=["GET"])
def debug_env():
    return jsonify({
        "SUPABASE_URL_set": bool(SUPABASE_URL),
        "SUPABASE_ANON_KEY_set": bool(SUPABASE_ANON_KEY),
    })



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
        except Exception:
            return jsonify({"error": "Token inválido o expirado"}), 401

        user = getattr(user_response, "user", None)
        if not user:
            return jsonify({"error": "Token inválido o expirado"}), 401

        request.user = user
        request.token = token
        return f(*args, **kwargs)

    return wrapper


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/profile", methods=["GET"])
@require_auth
def profile():
    user = request.user
    return jsonify({"id": user.id, "email": user.email})


@app.route("/api/items", methods=["GET"])
@require_auth
def list_items():
    client = get_client_with_auth(request.token)
    try:
        result = client.table("items").select("*").order("created_at", desc=True).execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/items", methods=["POST"])
@require_auth
def create_item():
    body = request.get_json(force=True, silent=True) or {}
    title = (body.get("title") or "").strip()
    if not title:
        return jsonify({"error": "El campo 'title' es obligatorio"}), 400

    client = get_client_with_auth(request.token)
    try:
        result = client.table("items").insert({
            "title": title,
            "user_id": request.user.id,
        }).execute()
        return jsonify(result.data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Vercel (runtime @vercel/python) importa este módulo y usa la variable
# "app" como aplicación WSGI. Para correr localmente: flask --app api/index run
if __name__ == "__main__":
    app.run(debug=True, port=5000)
