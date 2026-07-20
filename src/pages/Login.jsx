import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage(
        "Cuenta creada. Si la confirmación por correo está habilitada en Supabase, revisa tu bandeja antes de iniciar sesión."
      );
      return;
    }

    navigate("/dashboard");
  }

  async function handleGoogleLogin() {
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) setMessage(error.message);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</h1>

        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {message && <p className="message-text">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Procesando..."
              : mode === "signin"
              ? "Entrar"
              : "Registrarme"}
          </button>
        </form>

        <div className="divider">o</div>

        <button className="google-btn" onClick={handleGoogleLogin} type="button">
          Continuar con Google
        </button>

        <p className="switch-mode">
          {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
