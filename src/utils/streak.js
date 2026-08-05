export function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export function todayStr() {
  return toDateStr(new Date());
}

function atMidnight(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Racha de días consecutivos hasta hoy. Si hoy aún no se marcó, la racha
// sigue contando desde ayer (para no "reiniciarla" antes de que acabe el día).
export function computeStreak(datesSet) {
  const cursor = atMidnight(new Date());

  if (!datesSet.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!datesSet.has(toDateStr(cursor))) return 0;
  }

  let streak = 0;
  while (datesSet.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function lastNDays(n) {
  const today = atMidnight(new Date());
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function weekProgress(datesSet) {
  const today = todayStr();
  return lastNDays(7).map((d) => {
    const dateStr = toDateStr(d);
    return {
      date: dateStr,
      label: d.toLocaleDateString("es-ES", { weekday: "narrow" }).toUpperCase(),
      done: datesSet.has(dateStr),
      isToday: dateStr === today,
    };
  });
}
