const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const rawId = editingId === null ? draft?.id : editingId;
  const id = typeof rawId === "string" && rawId.trim() ? Number(rawId) : rawId;
  if (!Number.isSafeInteger(id) || id <= 0) errors.id = "Введите положительный целый id.";
  else if (editingId === null && tasks.some(task => task.id === id)) errors.id = "Этот id уже занят.";
  else if (editingId !== null && !tasks.some(task => task.id === id)) errors.id = "Задача не найдена.";

  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов после trim().";
  }
  const priority = draft?.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  return Object.keys(errors).length ? { ok: false, errors }
    : { ok: true, value: { id, title, priority } };
}
