import { ApiError } from './errors.js';

const priorities = new Set(['low', 'medium', 'high']);

export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export function parseFilters(searchParams) {
  const filters = { completed: null, priority: null, categoryId: null, q: '' };
  const seen = new Set();
  for (const [key, value] of searchParams) {
    if (!Object.hasOwn(filters, key) || seen.has(key)) {
      throw new ApiError(400, 'INVALID_QUERY', `Неизвестный или повторный параметр: ${key}.`);
    }
    seen.add(key);
    switch (key) {
      case 'completed':
        if (value !== 'true' && value !== 'false') invalidFilter(key);
        filters.completed = value === 'true';
        break;
      case 'priority':
        if (!priorities.has(value)) invalidFilter(key);
        filters.priority = value;
        break;
      case 'categoryId':
        filters.categoryId = parsePositiveId(value);
        if (filters.categoryId === null) invalidFilter(key);
        break;
      case 'q':
        filters.q = value.trim();
        if (filters.q.length > 100) invalidFilter(key);
        break;
    }
  }
  return filters;
}

function invalidFilter(key) {
  throw new ApiError(400, 'INVALID_QUERY', `Некорректное значение параметра ${key}.`);
}

export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const errors = {};
  if (!title || title.length > 100) errors.title = 'Введите от 1 до 100 символов.';
  if (!priorities.has(draft?.priority)) errors.priority = 'Допустимые значения: low, medium, high.';
  if (!categories.some(category => category.id === draft?.categoryId)) {
    errors.categoryId = 'Укажите числовой идентификатор существующей категории.';
  }
  if (Object.keys(errors).length) {
    throw new ApiError(400, 'INVALID_TASK', 'Проверьте поля задачи.', errors);
  }
  return { title, priority: draft.priority, categoryId: draft.categoryId };
}
