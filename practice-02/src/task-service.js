function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название задачи должно быть строкой" };
  }

  const value = title.trim();

  if (value.length < 1 || value.length > 100) {
    return { ok: false, error: "Название задачи должно содержать от 1 до 100 символов" };
  }

  return { ok: true, title: value };
}

function checkId(id) {
  if (!isValidId(id)) {
    return { ok: false, error: "Некорректный id" };
  }

  return { ok: true };
}

export function createTask(id, title, priority = "medium") {
  const idResult = checkId(id);

  if (!idResult.ok) {
    return idResult;
  }

  const titleResult = normalizeTitle(title);

  if (!titleResult.ok) {
    return titleResult;
  }

  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Некорректный приоритет" };
  }

  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : completed / total * 100;

  return {
    total,
    completed,
    pending,
    progress,
  };
}

export function addTask(tasks, id, title, priority = "medium") {
  const result = createTask(id, title, priority);

  if (!result.ok) {
    return result;
  }

  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }

  return {
    ok: true,
    tasks: [...tasks, result.task],
  };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = checkId(id);

  if (!idResult.ok) {
    return idResult;
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть boolean" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, completed } : task
    ),
  };
}

export function renameTask(tasks, id, title) {
  const idResult = checkId(id);

  if (!idResult.ok) {
    return idResult;
  }

  const titleResult = normalizeTitle(title);

  if (!titleResult.ok) {
    return titleResult;
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.map((task) =>
      task.id === id ? { ...task, title: titleResult.title } : task
    ),
  };
}

export function removeTask(tasks, id) {
  const idResult = checkId(id);

  if (!idResult.ok) {
    return idResult;
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.filter((task) => task.id !== id),
  };
}
