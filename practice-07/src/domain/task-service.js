const priorities = ['low', 'medium', 'high'];
export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const raw = draft?.categoryId;
  const categoryId = typeof raw === 'number' ||
    (typeof raw === 'string' && /^\d+$/.test(raw.trim())) ? Number(raw) : NaN;
  const errors = {};
  if (title.length < 1 || title.length > 100) errors.title = 'Название: от 1 до 100 символов после trim().';
  if (!priorities.includes(priority)) errors.priority = 'Выберите допустимый приоритет.';
  if (!Number.isSafeInteger(categoryId) || !categories.some(item => item.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}
export function selectTasks(tasks, filters) {
  const query = filters.q.trim().toLocaleLowerCase('ru-RU');
  return tasks.filter(task => {
    if (filters.completed !== '' && task.completed !== (filters.completed === 'true')) return false;
    if (filters.priority !== '' && task.priority !== filters.priority) return false;
    if (filters.categoryId !== '' && task.categoryId !== Number(filters.categoryId)) return false;
    return task.title.toLocaleLowerCase('ru-RU').includes(query);
  });
}
export function getTaskStats(tasks) {
  const completed = tasks.reduce((count, task) => count + Number(task.completed), 0);
  return { total: tasks.length, completed, active: tasks.length - completed };
}
export function addTask(tasks, value, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('Требуется свободный положительный безопасный целый id.');
  }
  const { title, priority, categoryId } = value;
  return [...tasks, { id, title, priority, categoryId, completed: false }];
}
export function updateTask(tasks, id, value) {
  const { title, priority, categoryId } = value;
  return tasks.map(task => task.id === id ? { ...task, title, priority, categoryId } : task);
}
export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}
export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}
