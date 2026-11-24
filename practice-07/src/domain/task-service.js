export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === 'number' ||
    (typeof rawCategory === 'string' && /^\d+$/.test(rawCategory.trim()))
    ? Number(rawCategory) : NaN;
  const errors = {};
  if (title.length < 1 || title.length > 100) errors.title = 'Введите от 1 до 100 символов.';
  if (!['low', 'medium', 'high'].includes(priority)) errors.priority = 'Выберите приоритет.';
  if (!categories.some(category => category.id === categoryId)) errors.categoryId = 'Выберите категорию.';
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}

export function selectTasks(tasks, filters) {
  const q = filters.q.trim().toLowerCase();
  return tasks.filter(task =>
    (!filters.completed || String(task.completed) === filters.completed) &&
    (!filters.priority || task.priority === filters.priority) &&
    (!filters.categoryId || String(task.categoryId) === filters.categoryId) &&
    task.title.toLowerCase().includes(q)
  );
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, { title, priority, categoryId }, id) {
  if (!Number.isSafeInteger(id) || id < 1 || tasks.some(task => task.id === id)) {
    throw new RangeError('Идентификатор должен быть положительным и уникальным.');
  }
  return [...tasks, { id, title, priority, categoryId, completed: false }];
}

export function updateTask(tasks, id, { title, priority, categoryId }) {
  return tasks.map(task => task.id === id ? { ...task, title, priority, categoryId } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}
