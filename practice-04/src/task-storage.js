export const STORAGE_VERSION = 1;
const copy = tasks => tasks.map(task => ({ ...task }));

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  return value.every(task => {
    if (!task || !Number.isSafeInteger(task.id) || task.id <= 0 || ids.has(task.id)
      || typeof task.title !== "string" || task.title !== task.title.trim()
      || task.title.length < 1 || task.title.length > 100
      || typeof task.completed !== "boolean"
      || !["low", "medium", "high"].includes(task.priority)) return false;
    ids.add(task.id);
    return true;
  });
}

export function loadTasks(storage, key, fallbackTasks) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: copy(fallbackTasks) };
    const value = JSON.parse(raw);
    if (!value || value.version !== STORAGE_VERSION || !isValidTaskList(value.tasks)) {
      throw new Error("Неверная версия или структура сохранённых задач.");
    }
    return { ok: true, source: "storage", tasks: copy(value.tasks) };
  } catch (error) {
    return { ok: false, source: "fallback", tasks: copy(fallbackTasks),
      error: `Не удалось прочитать localStorage: ${error.message}` };
  }
}

export function saveTasks(storage, key, tasks) {
  try {
    if (!isValidTaskList(tasks)) throw new Error("Некорректные задачи.");
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить localStorage: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить запись: ${error.message}` };
  }
}
