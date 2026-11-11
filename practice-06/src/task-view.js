const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

export function createTaskElement(task, category) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.classList.toggle("is-completed", task.completed);
  card.dataset.taskId = String(task.id);
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  const meta = document.createElement("p");
  meta.className = "task-meta";
  for (const [className, text] of [["task-id", `№ ${task.id}`],
    ["task-status", task.completed ? "Выполнена" : "В работе"],
    ["task-priority", PRIORITY_LABELS[task.priority]],
    ["task-category", category?.name ?? "Неизвестная категория"]]) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    meta.append(span);
  }
  const actions = document.createElement("div");
  actions.className = "task-actions";
  for (const [action, label] of [["toggle", task.completed ? "Вернуть в работу" : "Выполнить"], ["edit", "Изменить"], ["delete", "Удалить"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;
    button.append(span);
    if (action === "toggle") button.setAttribute("aria-pressed", String(task.completed));
    actions.append(button);
  }
  card.append(title, meta, actions);
  return card;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map(category => [category.id, category]));
  list.replaceChildren(...tasks.map(task => createTaskElement(task, byId.get(task.categoryId))));
}
