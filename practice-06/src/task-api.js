import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}


function normalizeFilters(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("Неверные фильтры.");
  const query = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(key)) throw new TypeError("Неизвестный фильтр.");
    if (key === "completed" && typeof value !== "boolean") throw new TypeError("Нужен boolean.");
    if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) throw new TypeError("Неверный приоритет.");
    if (key === "categoryId" && !isPositiveSafeInteger(value)) throw new TypeError("Неверная категория.");
    if (key === "q" && (typeof value !== "string" || value.trim().length > 100)) throw new TypeError("Неверный поиск.");
    const normalized = key === "q" ? value.trim() : value;
    if (normalized !== "") query[key] = normalized;
  }
  return query;
}
function checkedList(payload, check, filters = false) {
  if (!payload || !Array.isArray(payload.data) || !payload.data.every(check)
    || new Set(payload.data.map(item => item.id)).size !== payload.data.length
    || payload.meta?.total !== payload.data.length
    || (filters && (!payload.meta.filters || typeof payload.meta.filters !== "object" || Array.isArray(payload.meta.filters))))
    throw invalidResponse("Некорректная коллекция API.");
  return payload.data;
}
function checkId(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("Неверный id.");
}
function checkedTask(payload) {
  if (!isTask(payload?.data)) throw invalidResponse("Некорректная задача API.");
  return payload.data;
}

export function createTaskApi(client) {
  if (typeof client?.requestJson !== "function") throw new TypeError("Нужен HTTP-клиент.");
  async function getTasks(filters = {}, options) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, ...options });
    const tasks = checkedList(payload, isTask, true);
    return { tasks, meta: payload.meta };
  }
  async function getTaskById(id, options) {
    checkId(id);
    return checkedTask(await client.requestJson(`/tasks/${id}`, options));
  }
  async function getCategories(options) {
    return checkedList(await client.requestJson("/categories", options), isCategory);
  }
  async function loadInitialData(filters = {}, options) {
    const [result, categories] = await Promise.all([getTasks(filters, options), getCategories(options)]);
    return { ...result, categories };
  }

  async function createTask(draft, options) {
    return checkedTask(await client.requestJson("/tasks", { ...options, method: "POST", body: draft }));
  }
  async function updateTask(id, changes, options) {
    checkId(id);
    return checkedTask(await client.requestJson(`/tasks/${id}`, { ...options, method: "PATCH", body: changes }));
  }
  async function setTaskCompleted(id, completed, options) {
    if (typeof completed !== "boolean") throw new TypeError("Нужен boolean.");
    return updateTask(id, { completed }, options);
  }
  async function deleteTask(id, options) {
    checkId(id);
    const result = await client.requestJson(`/tasks/${id}`, { ...options, method: "DELETE" });
    if (result !== null) throw invalidResponse("Ожидался ответ 204.");
    return null;
  }
  async function resetDemoData(options) {
    const result = await client.requestJson("/debug/reset", { ...options, method: "POST" });
    if (result?.data?.reset !== true || !Number.isSafeInteger(result.data.total) || result.data.total < 0)
      throw invalidResponse("Нет подтверждения сброса.");
    return result.data;
  }
  return { getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
    setTaskCompleted, deleteTask, resetDemoData };
}
