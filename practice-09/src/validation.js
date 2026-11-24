import { ApiError } from './errors.js';
const priorities = ['low', 'medium', 'high'];
export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}
export function parseFilters(searchParams) {
  const result = { completed: null, priority: null, categoryId: null, q: '' };
  for (const name of searchParams.keys()) {
    if (!Object.hasOwn(result, name) || searchParams.getAll(name).length !== 1) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный или повторный параметр ${name}.`);
    }
  }
  for (const [name, raw] of searchParams) {
    let valid = true;
    if (name === 'completed') {
      valid = raw === 'true' || raw === 'false';
      result.completed = raw === 'true';
    } else if (name === 'priority') {
      valid = priorities.includes(raw); result.priority = raw;
    } else if (name === 'categoryId') {
      result.categoryId = parsePositiveId(raw); valid = result.categoryId !== null;
    } else {
      result.q = raw.trim(); valid = result.q.length <= 100;
    }
    if (!valid) throw new ApiError(400, 'INVALID_QUERY', `Недопустимое значение ${name}.`);
  }
  return result;
}
// Дополнение КР3: черновик проверяется независимо от HTML-формы.
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const object = draft !== null && typeof draft === 'object' && !Array.isArray(draft);
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  if (!object) errors.body = 'Ожидается JSON-объект.';
  if (title.length < 1 || title.length > 100) errors.title = 'Название: от 1 до 100 символов после trim().';
  if (!priorities.includes(draft?.priority)) errors.priority = 'Допустимы low, medium, high.';
  if (!Number.isSafeInteger(draft?.categoryId) || !categories.some(item => item.id === draft.categoryId)) {
    errors.categoryId = 'Нужен числовой id существующей категории.';
  }
  if (object && Object.keys(draft).some(key => !['title', 'priority', 'categoryId'].includes(key))) {
    errors.fields = 'Разрешены только title, priority, categoryId.';
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'INVALID_TASK', 'Проверьте поля задачи.', errors);
  return { title, priority: draft.priority, categoryId: draft.categoryId };
}
