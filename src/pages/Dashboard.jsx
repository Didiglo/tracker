import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import { useHabits } from "../hooks/useHabits";
import HabitCard from "../components/HabitCard";
import HabitFormModal from "../components/HabitFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { todayStr } from "../utils/streak";

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const {
    habits,
    loading,
    error,
    logsForHabit,
    addHabit,
    editHabit,
    removeHabit,
    toggleToday,
    updateLogNote,
  } = useHabits();

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);
  const [actionError, setActionError] = useState("");

  const today = todayStr();
  const completedToday = useMemo(
    () =>
      habits.filter((h) =>
        logsForHabit(h.id).some((l) => l.log_date === today)
      ).length,
    [habits, logsForHabit, today]
  );
  const progressPct = habits.length
    ? Math.round((completedToday / habits.length) * 100)
    : 0;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function openCreate() {
    setEditingHabit(null);
    setFormOpen(true);
  }

  function openEdit(habit) {
    setEditingHabit(habit);
    setFormOpen(true);
  }

  async function handleSubmitForm(data) {
    if (editingHabit) {
      await editHabit(editingHabit.id, data);
    } else {
      await addHabit(data);
    }
  }

  async function handleToggle(habitId) {
    try {
      setActionError("");
      await toggleToday(habitId);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleConfirmDelete() {
    try {
      await removeHabit(deletingHabit.id);
      setDeletingHabit(null);
    } catch (err) {
      setActionError(err.message);
      setDeletingHabit(null);
    }
  }

  function handleNote(log) {
    const note = window.prompt("Nota para hoy:", log.note || "");
    if (note === null) return;
    updateLogNote(log.id, note).catch((err) => setActionError(err.message));
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Mis hábitos 🌟</h1>
          <p className="muted">
            Hola, <strong>{session?.user?.email}</strong>
          </p>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <section className="stats-bar">
        <div className="stat-pill">
          <span className="stat-value">{habits.length}</span>
          <span className="stat-label">Hábitos</span>
        </div>
        <div className="stat-pill">
          <span className="stat-value">
            {completedToday}/{habits.length}
          </span>
          <span className="stat-label">Hoy</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      {(error || actionError) && (
        <p className="message-text">{error || actionError}</p>
      )}

      {loading ? (
        <p className="center-text">Cargando tus hábitos...</p>
      ) : habits.length === 0 ? (
        <div className="empty-state">
          <p className="empty-emoji">🌱</p>
          <p>Todavía no tienes hábitos. ¡Crea el primero!</p>
        </div>
      ) : (
        <div className="habit-grid">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              logs={logsForHabit(habit.id)}
              onToggleToday={handleToggle}
              onEdit={openEdit}
              onDelete={setDeletingHabit}
              onNote={handleNote}
            />
          ))}
        </div>
      )}

      <button className="fab" onClick={openCreate} aria-label="Nuevo hábito">
        +
      </button>

      {formOpen && (
        <HabitFormModal
          initial={editingHabit}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitForm}
        />
      )}

      {deletingHabit && (
        <ConfirmDialog
          title="¿Eliminar hábito?"
          message={`Se borrará "${deletingHabit.name}" y todo su historial. Esta acción no se puede deshacer.`}
          onCancel={() => setDeletingHabit(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
