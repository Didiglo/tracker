import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [status, setStatus] = useState("");

  async function authFetch(path, options = {}) {
    const token = session?.access_token;
    return fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  async function loadData() {
    try {
      const [profileRes, itemsRes] = await Promise.all([
        authFetch("/api/profile"),
        authFetch("/api/items"),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch (err) {
      setStatus("No se pudo conectar con el backend: " + err.message);
    }
  }

  useEffect(() => {
    if (session) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await authFetch("/api/items", {
      method: "POST",
      body: JSON.stringify({ title: newTitle }),
    });

    if (res.ok) {
      setNewTitle("");
      loadData();
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Error al crear el elemento");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel principal</h1>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <p>
        Sesión iniciada como: <strong>{session?.user?.email}</strong>
      </p>
      {profile && (
        <p className="muted">
          Verificado por el backend (Flask): {profile.email}
        </p>
      )}
      {status && <p className="message-text">{status}</p>}

      <section>
        <h2>Mis elementos</h2>
        <form onSubmit={handleAddItem} className="item-form">
          <input
            type="text"
            placeholder="Nuevo elemento"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit">Agregar</button>
        </form>

        {items.length === 0 ? (
          <p className="muted">No hay elementos todavía.</p>
        ) : (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
