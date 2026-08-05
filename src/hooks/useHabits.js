import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import * as habitsApi from "../services/habits";
import { todayStr } from "../utils/streak";

export function useHabits() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [habitsData, logsData] = await Promise.all([
        habitsApi.fetchHabits(token),
        habitsApi.fetchLogs(token, 30),
      ]);
      setHabits(habitsData || []);
      setLogs(logsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const logsForHabit = useCallback(
    (habitId) => logs.filter((l) => l.habit_id === habitId),
    [logs]
  );

  async function addHabit(data) {
    const created = await habitsApi.createHabit(token, data);
    setHabits((prev) => [...prev, created]);
  }

  async function editHabit(id, data) {
    const updated = await habitsApi.updateHabit(token, id, data);
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
  }

  async function removeHabit(id) {
    await habitsApi.deleteHabit(token, id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habit_id !== id));
  }

  async function toggleToday(habitId) {
    const today = todayStr();
    const existing = logs.find(
      (l) => l.habit_id === habitId && l.log_date === today
    );
    if (existing) {
      await habitsApi.deleteLog(token, existing.id);
      setLogs((prev) => prev.filter((l) => l.id !== existing.id));
    } else {
      const created = await habitsApi.createLog(token, habitId, {
        log_date: today,
      });
      setLogs((prev) => [created, ...prev]);
    }
  }

  async function updateLogNote(logId, note) {
    const updated = await habitsApi.updateLog(token, logId, { note });
    setLogs((prev) => prev.map((l) => (l.id === logId ? updated : l)));
  }

  return {
    habits,
    logs,
    loading,
    error,
    logsForHabit,
    addHabit,
    editHabit,
    removeHabit,
    toggleToday,
    updateLogNote,
    reload: load,
  };
}
