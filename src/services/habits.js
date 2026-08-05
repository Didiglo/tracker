import { api } from "./api";

// Entidad: habits
export const fetchHabits = (token) => api.get("/api/habits", token);

export const createHabit = (token, data) => api.post("/api/habits", token, data);

export const updateHabit = (token, id, data) =>
  api.put(`/api/habits/${id}`, token, data);

export const deleteHabit = (token, id) => api.del(`/api/habits/${id}`, token);

// Entidad: habit_logs (check-ins)
export const fetchLogs = (token, days = 30) =>
  api.get(`/api/logs?days=${days}`, token);

export const createLog = (token, habitId, data = {}) =>
  api.post(`/api/habits/${habitId}/logs`, token, data);

export const updateLog = (token, logId, data) =>
  api.put(`/api/logs/${logId}`, token, data);

export const deleteLog = (token, logId) => api.del(`/api/logs/${logId}`, token);

export const fetchProfile = (token) => api.get("/api/profile", token);
