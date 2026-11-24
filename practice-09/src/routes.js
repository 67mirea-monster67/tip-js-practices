import { json, Router } from 'express';
import { ApiError } from './errors.js';
import { parsePositiveId, parseFilters, validateTaskDraft } from './validation.js';

export function createRouter(store, { control = false } = {}) {
  const router = Router({ caseSensitive: true });
  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    return res.json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    const { searchParams } = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(searchParams);
    const tasks = store.listTasks(filters);
    if (control) return res.status(200).json(tasks);
    return res.json({ data: tasks, meta: { total: tasks.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный id.');
    const task = store.getTask(id);
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    return res.json({ data: task });
  });

  if (control) {
    router.post('/tasks', json({ limit: '16kb' }), (req, res) => {
      const value = validateTaskDraft(req.body, store.listCategories());
      const task = store.addTask(value);
      return res.location(`/api/tasks/${task.id}`).status(201).json({ data: task });
    });
  }

  for (const path of ['/health', '/categories', '/tasks', '/tasks/:id']) {
    router.all(path, (req, res, next) => {
      const allow = control && path === '/tasks' ? 'GET, HEAD, POST, OPTIONS' : 'GET, HEAD, OPTIONS';
      res.set('Allow', allow);
      next(new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается.'));
    });
  }
  return router;
}
