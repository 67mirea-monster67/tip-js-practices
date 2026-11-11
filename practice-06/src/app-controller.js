import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}


export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  for (const method of ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"])
    if (typeof api?.[method] !== "function") throw new TypeError("Нужен предметный API.");
  for (const method of ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"])
    if (typeof view?.[method] !== "function") throw new TypeError("Нужно представление.");
  if (typeof validateDraft !== "function") throw new TypeError("Нужен валидатор.");
  let tasks = [], categories = [], filters = {}, editingId = null;
  let categoriesLoaded = false, active = null, sequence = 0, pending = false, destroyed = false;

  async function loadCurrentTasks() {
    if (destroyed) return;
    const number = ++sequence;
    active?.abort();
    active = new AbortController();
    const signal = active.signal;
    view.setListState("loading");
    try {
      const result = categoriesLoaded ? await api.getTasks(filters, { signal })
        : await api.loadInitialData(filters, { signal });
      if (number !== sequence || destroyed) return;
      if (result.categories) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
      if (pending) view.setMutationPending(true);
    } catch (error) {
      if (number !== sequence || destroyed || error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    }
  }
  function cancelEdit() {
    editingId = null;
    view.showFormErrors({});
    view.setFormTask(null);
  }
  async function mutate(operation, resetForm = false) {
    if (pending || destroyed) return;
    pending = true;
    view.setMutationPending(true);
    try {
      await operation();
      if (destroyed) return;
      if (resetForm) cancelEdit();
      view.notify("Операция выполнена.", "success");
      await loadCurrentTasks();
    } catch (error) {
      if (!destroyed && error.kind !== "aborted") view.notify(messageForError(error), "error");
    } finally {
      pending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }
  return {
    start(initial = {}) { filters = { ...initial }; return loadCurrentTasks(); },
    applyFilters(value) { filters = { ...value }; return loadCurrentTasks(); },
    refresh: loadCurrentTasks,
    submit(draft) {
      if (pending || destroyed) return Promise.resolve();
      const checked = validateDraft(draft, categories);
      view.showFormErrors(checked.errors);
      if (!checked.valid) return Promise.resolve();
      const id = editingId;
      return mutate(() => id === null ? api.createTask(checked.value) : api.updateTask(id, checked.value), true);
    },
    beginEdit(id) {
      if (pending || destroyed) return;
      const task = tasks.find(task => task.id === id);
      if (!task) { view.notify("Задача не найдена.", "error"); return; }
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },
    cancelEdit,
    toggleTask(id) {
      const task = tasks.find(task => task.id === id);
      if (!task) { view.notify("Задача не найдена.", "error"); return Promise.resolve(); }
      return mutate(() => api.setTaskCompleted(id, !task.completed));
    },
    deleteTask(id) { return mutate(() => api.deleteTask(id), editingId === id); },
    resetData() { return mutate(() => api.resetDemoData(), true); },
    destroy() { destroyed = true; sequence++; active?.abort(); },
  };
}
