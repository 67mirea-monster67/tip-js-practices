import { Router, json } from 'express';
import { ApiError } from './errors.js';
import { parseFilters, parsePositiveId, validateTaskDraft } from './validation.js';
export function createRouter(store, { control = false } = {}) {
  const router = Router({ caseSensitive: true });
  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });
  router.get('/tasks', (req, res) => {
    const url = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(url.searchParams);
    const data = store.listTasks(filters);
    // КР3 требует JSON-массив; обычная ПР9 требует оболочку data/meta.
    return res.status(200).json(control ? data : { data, meta: { total: data.length, filters } });
  });
  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный id задачи.');
    const data = store.getTask(id);
    if (data === null) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    return res.json({ data });
  });
  if (control) {
    router.post('/tasks', (req, res, next) => {
      if (!req.is('application/json')) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Используйте application/json.');
      next();
    }, json({ limit: '16kb', strict: false }), (req, res) => {
      const value = validateTaskDraft(req.body, store.listCategories());
      const data = store.addTask(value);
      return res.location(`/api/tasks/${data.id}`).status(201).json({ data });
    });
  }
  for (const path of ['/health', '/categories', '/tasks', '/tasks/:id']) {
    router.all(path, (req, res) => {
      res.set('Allow', control && path === '/tasks' ? 'GET, HEAD, POST, OPTIONS' : 'GET, HEAD, OPTIONS');
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается.');
    });
  }
  return router;
}
