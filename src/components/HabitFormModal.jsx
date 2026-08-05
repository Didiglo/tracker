import { useEffect, useState } from "react";

const EMOJIS = [
  "💪", "📚", "💧", "🏃", "🧘", "🥗", "😴", "🎯",
  "✍️", "🎨", "🎸", "💰", "🚭", "🧹", "🌱", "☀️",
];

const COLORS = [
  "#7C5CFC", "#FF6B6B", "#00C2A8", "#FFB84C",
  "#4D96FF", "#FF6FB5", "#6BCB77", "#FF922B",
];

export default function HabitFormModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name || "");
  const [emoji, setEmoji] = useState(initial?.emoji || EMOJIS[0]);
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [target, setTarget] = useState(initial?.target_days_per_week || 7);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ponle un nombre a tu hábito");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        emoji,
        color,
        target_days_per_week: target,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Editar hábito" : "Nuevo hábito ✨"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tomar 2L de agua"
              autoFocus
              maxLength={80}
            />
          </label>

          <span className="field-label">Ícono</span>
          <div className="emoji-grid">
            {EMOJIS.map((e2) => (
              <button
                type="button"
                key={e2}
                className={`emoji-option ${emoji === e2 ? "selected" : ""}`}
                onClick={() => setEmoji(e2)}
              >
                {e2}
              </button>
            ))}
          </div>

          <span className="field-label">Color</span>
          <div className="color-grid">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-option ${color === c ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <label>
            Meta semanal: <strong>{target}</strong>{" "}
            {target === 1 ? "día" : "días"}
            <input
              type="range"
              min={1}
              max={7}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </label>

          {error && <p className="message-text">{error}</p>}

          <div className="modal-buttons">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Guardando..."
                : isEdit
                ? "Guardar cambios"
                : "Crear hábito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
