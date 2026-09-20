(function () {
  const demoTasks = [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
  const variantNumber = 1;
  const variantTasks = [
    { id: 11, title: "Определить тему проекта", completed: false, priority: "low" },
    { id: 23, title: "Составить план проекта", completed: false, priority: "medium" },
    { id: 37, title: "Подготовить структуру проекта", completed: false, priority: "high" },
    { id: 41, title: "Реализовать основные функции", completed: false, priority: "medium" },
    { id: 58, title: "Проверить работу проекта", completed: false, priority: "low" },
    { id: 64, title: "Оформить результаты работы", completed: false, priority: "high" },
  ];

  function isValidId(id) {
    return Number.isSafeInteger(id) && id > 0;
  }

  function findTaskById(tasks, id) {
    return tasks.find((task) => task.id === id);
  }

  function setTaskCompleted(tasks, id, completed) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    if (typeof completed !== "boolean") return { ok: false, error: "completed должен быть boolean" };
    if (findTaskById(tasks, id) === undefined) return { ok: false, error: "Задача не найдена" };
    return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, completed } : task) };
  }

  function removeTask(tasks, id) {
    if (!isValidId(id)) return { ok: false, error: "Некорректный id" };
    if (findTaskById(tasks, id) === undefined) return { ok: false, error: "Задача не найдена" };
    return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
  }

  function getVisibleTasks(tasks, filter) {
    if (filter === "pending") return tasks.filter((task) => task.completed === false);
    if (filter === "completed") return tasks.filter((task) => task.completed === true);
    return [...tasks];
  }

  function getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed === true).length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : completed / total * 100;
    return { total, completed, pending, progress };
  }

  const priorityLabels = { low: "Низкий", medium: "Средний", high: "Высокий" };

  function createTaskElement(task) {
    const card = document.createElement("li");
    card.className = "task-card";
    card.dataset.taskId = String(task.id);
    if (task.completed) card.classList.add("is-completed");

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.completed ? "Выполнена" : "В работе";

    const priority = document.createElement("span");
    priority.className = "task-priority";
    priority.textContent = priorityLabels[task.priority];

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.dataset.action = "toggle";
    toggle.setAttribute("aria-pressed", String(task.completed));
    const toggleLabel = document.createElement("span");
    toggleLabel.className = "action-label";
    toggleLabel.textContent = "Выполнена";
    toggle.append(toggleLabel);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "delete";
    const removeLabel = document.createElement("span");
    removeLabel.className = "action-label";
    removeLabel.textContent = "Удалить";
    remove.append(removeLabel);

    actions.append(toggle, remove);
    card.append(title, status, priority, actions);
    return card;
  }

  function renderApp() {
    const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
    renderTaskList(elements.list, visibleTasks);
    renderSummary(elements.summary, currentTasks, visibleTasks.length);
    renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);
    elements.filters.querySelectorAll("button[data-filter]").forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderTaskList(listElement, tasks) {
    listElement.replaceChildren(...tasks.map(createTaskElement));
  }

  function renderSummary(summaryElement, tasks, visibleCount) {
    const { total, completed, pending, progress } = getTaskStats(tasks);
    summaryElement.querySelector('[data-stat="total"]').textContent = String(total);
    summaryElement.querySelector('[data-stat="completed"]').textContent = String(completed);
    summaryElement.querySelector('[data-stat="pending"]').textContent = String(pending);
    summaryElement.querySelector('[data-stat="progress"]').textContent = `${progress.toFixed(1)}%`;
    summaryElement.querySelector('[data-stat="visible"]').textContent = String(visibleCount);
  }

  function renderEmptyState(messageElement, total, visibleCount) {
    if (visibleCount > 0) {
      messageElement.textContent = "";
      messageElement.hidden = true;
      return;
    }
    messageElement.hidden = false;
    messageElement.textContent = total === 0 ? "Список задач пуст." : "Нет задач по выбранному фильтру.";
  }

  const elements = {
    list: document.querySelector("#task-list"),
    filters: document.querySelector("#task-filters"),
    summary: document.querySelector("#task-summary"),
    empty: document.querySelector("#empty-message"),
    message: document.querySelector("#operation-message"),
    datasetLabel: document.querySelector("#dataset-label"),
  };

  const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
  const initialTasks = isVariant ? variantTasks : demoTasks;
  let currentTasks = initialTasks.map((task) => ({ ...task }));
  let currentFilter = "all";

  elements.datasetLabel.textContent = isVariant ? `Индивидуальный вариант: ${variantNumber}` : "Общий контрольный набор";

  function restoreTaskFocus(id, action) {
    const actionButton = elements.list.querySelector(`[data-task-id="${id}"] button[data-action="${action}"]`);
    const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
    (actionButton ?? filterButton)?.focus();
  }

  function handleTaskListClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-action]");
    if (!button || !elements.list.contains(button)) return;
    const action = button.dataset.action;
    if (action !== "toggle" && action !== "delete") return;
    const card = button.closest("[data-task-id]");
    if (!card || !elements.list.contains(card)) return;
    const id = Number(card.dataset.taskId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      elements.message.textContent = "Некорректный идентификатор задачи";
      return;
    }

    let result;
    if (action === "toggle") {
      const task = findTaskById(currentTasks, id);
      if (!task) {
        elements.message.textContent = "Задача не найдена";
        return;
      }
      result = setTaskCompleted(currentTasks, id, !task.completed);
    } else {
      result = removeTask(currentTasks, id);
    }

    if (!result.ok) {
      elements.message.textContent = result.error;
      return;
    }

    currentTasks = result.tasks;
    elements.message.textContent = "";
    renderApp();
    restoreTaskFocus(id, action);
  }

  function handleFilterClick(event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-filter]");
    if (!button || !elements.filters.contains(button)) return;
    const filter = button.dataset.filter;
    if (!["all", "pending", "completed"].includes(filter)) return;
    currentFilter = filter;
    elements.message.textContent = "";
    renderApp();
  }

  elements.list.addEventListener("click", handleTaskListClick);
  elements.filters.addEventListener("click", handleFilterClick);
  renderApp();
})();
