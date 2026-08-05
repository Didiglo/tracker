import { useMemo } from "react";
import { computeStreak, weekProgress, todayStr } from "../utils/streak";

export default function HabitCard({ habit, logs, onToggleToday, onEdit, onDelete, onNote }) {
  const dateSet = useMemo(() => new Set(logs.map((l) => l.log_date)), [logs]);
  const streak = useMemo(() => computeStreak(dateSet), [dateSet]);
  const week = useMemo(() => weekProgress(dateSet), [dateSet]);
  const doneToday = dateSet.has(todayStr());
  const todayLog = logs.find((l) => l.log_date === todayStr());

  return (
    <article className="habit-card" style={{ "--habit-color": habit.color }}>
      <div className="habit-card-top">
        <span className="habit-emoji">{habit.emoji}</span>
        <div className="habit-card-actions">
          <button
            className="icon-btn"
            onClick={() => onEdit(habit)}
            title="Editar"
            aria-label="Editar hábito"
          >
            ✏️
          </button>
          <button
            className="icon-btn"
            onClick={() => onDelete(habit)}
            title="Eliminar"
            aria-label="Eliminar hábito"
          >
            🗑️
          </button>
        </div>
      </div>

      <h3 className="habit-name">{habit.name}</h3>
      <p className="habit-goal">
        Meta: {habit.target_days_per_week}x por semana
      </p>

      <div className="week-dots">
        {week.map((day) => (
          <div
            key={day.date}
            className={`day-dot ${day.done ? "done" : ""} ${
              day.isToday ? "today" : ""
            }`}
            title={day.date}
          >
            <span>{day.label}</span>
          </div>
        ))}
      </div>

      <div className="habit-card-bottom">
        <div className="streak-badge">
          🔥 <strong>{streak}</strong> {streak === 1 ? "día" : "días"}
        </div>
        <div className="habit-card-buttons">
          {doneToday && todayLog && (
            <button
              className="icon-btn"
              onClick={() => onNote(todayLog)}
              title={todayLog.note ? `Nota: ${todayLog.note}` : "Agregar nota"}
              aria-label="Agregar nota del día"
            >
              📝
            </button>
          )}
          <button
            className={`check-btn ${doneToday ? "checked" : ""}`}
            onClick={() => onToggleToday(habit.id)}
          >
            {doneToday ? "¡Hecho hoy! ✓" : "Marcar hoy"}
          </button>
        </div>
      </div>
    </article>
  );
}
