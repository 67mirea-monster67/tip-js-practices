import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';

async function withApi(run) {
  const server = createApp({ control: true }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, body, options = {}) => {
    const response = await fetch(base + path, body === undefined ? options : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options,
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  try { await run(request); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('КР3 GET completed=true: 200, массив только завершённых задач', () => withApi(async request => {
  const r = await request('/tasks?completed=true');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body));
  assert.deepEqual(r.body.map(task => task.id), [1, 10, 16, 25, 31]);
  assert.ok(r.body.every(task => task.completed === true));
}));
for (const [label, title] of [['отсутствует', undefined], ['пробелы', '   '], ['число', 5], ['null', null], ['длинное', 'x'.repeat(101)]]) {
  test(`КР3 POST title ${label}: 400 и сервер продолжает работать`, () => withApi(async request => {
    const r = await request('/tasks', { title, priority: 'high', categoryId: 2 });
    assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INVALID_TASK');
    assert.ok(r.body.error.details.title);
    assert.equal((await request('/health')).status, 200);
    assert.equal((await request('/tasks')).body.length, 12);
  }));
}
test('КР3 POST: нормализация, 201, Location и чтение по назначенному id', () => withApi(async request => {
  const r = await request('/tasks', { title: '  Новая задача  ', priority: 'high', categoryId: 2 });
  assert.equal(r.status, 201); assert.equal(r.body.data.title, 'Новая задача');
  assert.equal(r.body.data.completed, false);
  assert.equal(r.headers.get('location'), `/api/tasks/${r.body.data.id}`);
  assert.deepEqual((await request(`/tasks/${r.body.data.id}`)).body.data, r.body.data);
}));
test('КР3 POST: повреждённый JSON — 400 INVALID_JSON', () => withApi(async request => {
  const r = await request('/tasks', {}, { body: '{' });
  assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INVALID_JSON');
}));
test('КР3 POST: неверный Content-Type — 415', () => withApi(async request => {
  const r = await request('/tasks', {}, { headers: { 'Content-Type': 'text/plain' } });
  assert.equal(r.status, 415);
}));
test('КР3 POST: слишком большое тело — 413', () => withApi(async request => {
  const r = await request('/tasks', { title: 'x'.repeat(17000) }); assert.equal(r.status, 413);
}));
test('КР3 POST: JSON-массив и null отклоняются как черновик', () => withApi(async request => {
  for (const body of [[], null]) {
    const r = await request('/tasks', body);
    assert.equal(r.status, 400); assert.ok(r.body.error.details.body);
  }
}));
test('КР3 POST: категория, приоритет и неизвестные поля проверяются вместе', () => withApi(async request => {
  const r = await request('/tasks', { title: 'Задача', priority: 'urgent', categoryId: 999, completed: true });
  assert.equal(r.status, 400);
  for (const field of ['priority', 'categoryId', 'fields']) assert.ok(r.body.error.details[field]);
}));
