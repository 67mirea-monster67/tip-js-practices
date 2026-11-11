export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  const raw = draft?.categoryId;
  const categoryId = typeof raw === "string" && raw.trim() ? Number(raw) : raw;
  if (!title || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!["low", "medium", "high"].includes(priority)) errors.priority = "Выберите приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !categories.some(category => category.id === categoryId))
    errors.categoryId = "Выберите существующую категорию.";
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}
