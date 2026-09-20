import assert from "node:assert/strict";
import {
  createTask, findTaskById, getPendingTasks, getTaskTitles, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask,
} from "./src/task-service.js";

let passed = 0;
let failed = 0;

function check(name, action) {
  try {
    action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.message);
  }
}

function fixture() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

function expectFailure(result) {
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, "string");
  assert.ok(result.error.trim().length > 0);
}

function expectTask(result) {
  assert.equal(result.ok, true);
  assert.ok(result.task && typeof result.task === "object");
  return result.task;
}

function expectTasks(result) {
  assert.equal(result.ok, true);
  assert.ok(Array.isArray(result.tasks));
  return result.tasks;
}

const invalidIds = [0, -1, 1.5, "4", NaN, Infinity, null, undefined, Number.MAX_SAFE_INTEGER + 1];
const invalidTitles = ["", "   ", "x".repeat(101), 42, null, undefined];

check("createTask с явным приоритетом", () => {
  assert.deepEqual(expectTask(createTask(20, "Новая задача", "high")), {
    id: 20,
    title: "Новая задача",
    completed: false,
    priority: "high",
  });
});

check("Приоритет по умолчанию", () => {
  assert.equal(expectTask(createTask(20, "Новая задача")).priority, "medium");
  assert.equal(expectTask(createTask(20, "Новая задача", undefined)).priority, "medium");
});

check("Нормализация названия", () => {
  assert.equal(expectTask(createTask(20, "  Проверить  данные  ", "low")).title, "Проверить  данные");
});

check("Граничные длины и id", () => {
  assert.equal(expectTask(createTask(1, "x")).title.length, 1);
  assert.equal(expectTask(createTask(2, "x".repeat(100))).title.length, 100);
  assert.equal(expectTask(createTask(Number.MAX_SAFE_INTEGER, "Граница id")).id, Number.MAX_SAFE_INTEGER);
});

check("Некорректные названия", () => {
  for (const title of invalidTitles) {
    expectFailure(createTask(20, title));
  }
});

check("Некорректные id", () => {
  for (const id of invalidIds) {
    expectFailure(createTask(id, "Новая задача"));
  }
});

check("Допустимые и недопустимые приоритеты", () => {
  for (const priority of ["low", "medium", "high"]) {
    assert.equal(expectTask(createTask(20, "Новая задача", priority)).priority, priority);
  }
  for (const priority of ["urgent", "HIGH", "", " high ", null, 1]) {
    expectFailure(createTask(20, "Новая задача", priority));
  }
});

check("Каждый createTask создаёт новый объект", () => {
  const first = expectTask(createTask(20, "Новая задача"));
  const second = expectTask(createTask(20, "Новая задача"));
  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});

check("findTaskById", () => {
  const tasks = fixture();
  assert.equal(findTaskById(tasks, 4), tasks[1]);
  assert.equal(findTaskById(tasks, 10), tasks[3]);
  assert.equal(findTaskById(tasks, "4"), undefined);
});

check("Поиск отсутствующей задачи", () => {
  assert.equal(findTaskById(fixture(), 777), undefined);
  assert.equal(findTaskById([], 1), undefined);
});

check("getPendingTasks", () => {
  const tasks = fixture();
  const pending = getPendingTasks(tasks);
  assert.deepEqual(pending.map((task) => task.id), [4, 7]);
  assert.notEqual(pending, tasks);
  assert.deepEqual(tasks, fixture());
});

check("getTaskTitles", () => {
  assert.deepEqual(getTaskTitles(fixture()), [
    "Изучить функции",
    "Подготовить модель задач",
    "Проверить методы массивов",
    "Оформить README",
  ]);
  assert.deepEqual(getTaskTitles([]), []);
});

check("getTaskStats", () => {
  assert.deepEqual(getTaskStats(fixture()), {
    total: 4,
    completed: 2,
    pending: 2,
    progress: 50,
  });
  assert.deepEqual(getTaskStats([]), {
    total: 0,
    completed: 0,
    pending: 0,
    progress: 0,
  });
});

check("Крайние значения progress", () => {
  assert.deepEqual(getTaskStats(fixture().map((task) => ({ ...task, completed: false }))), {
    total: 4, completed: 0, pending: 4, progress: 0,
  });
  assert.deepEqual(getTaskStats(fixture().map((task) => ({ ...task, completed: true }))), {
    total: 4, completed: 4, pending: 0, progress: 100,
  });
});

check("Дробный progress", () => {
  const result = getTaskStats(fixture().slice(0, 3));
  assert.equal(typeof result.progress, "number");
  assert.ok(Math.abs(result.progress - 100 / 3) < 1e-10);
  assert.equal(result.progress.toFixed(1), "33.3");
});

check("addTask без мутации", () => {
  const tasks = fixture();
  const before = copyTasks(tasks);
  const next = expectTasks(addTask(tasks, 20, "  Добавить проверку  ", "high"));
  assert.notEqual(next, tasks);
  assert.deepEqual(next[next.length - 1], {
    id: 20, title: "Добавить проверку", completed: false, priority: "high",
  });
  assert.deepEqual(tasks, before);
});

check("addTask в пустой список", () => {
  const tasks = [];
  const next = expectTasks(addTask(tasks, 20, "Первая задача"));
  assert.equal(next.length, 1);
  assert.equal(next[0].priority, "medium");
  assert.notEqual(next, tasks);
});

check("Дубликат id", () => {
  const tasks = fixture();
  expectFailure(addTask(tasks, 4, "Другая задача"));
  assert.deepEqual(tasks, fixture());
});

check("setTaskCompleted", () => {
  const tasks = fixture();
  const next = expectTasks(setTaskCompleted(tasks, 4, true));
  assert.deepEqual(next[1], { ...tasks[1], completed: true });
  assert.notEqual(next, tasks);
  assert.notEqual(next[1], tasks[1]);
  assert.deepEqual(tasks, fixture());
});

check("Некорректный completed", () => {
  const tasks = fixture();
  for (const value of ["true", "false", 1, 0, null, undefined]) {
    expectFailure(setTaskCompleted(tasks, 4, value));
  }
  assert.deepEqual(tasks, fixture());
});

check("Повторная установка completed", () => {
  const tasks = fixture();
  const next = expectTasks(setTaskCompleted(tasks, 1, true));
  assert.notEqual(next, tasks);
  assert.notEqual(next[0], tasks[0]);
  assert.deepEqual(next, tasks);
});

check("renameTask", () => {
  const tasks = fixture();
  const next = expectTasks(renameTask(tasks, 10, "  Подготовить инструкцию запуска  "));
  assert.deepEqual(next[3], {
    ...tasks[3],
    title: "Подготовить инструкцию запуска",
  });
  assert.notEqual(next[3], tasks[3]);
  assert.deepEqual(tasks, fixture());
});

check("Некорректное название при renameTask", () => {
  const tasks = fixture();
  for (const title of invalidTitles) {
    expectFailure(renameTask(tasks, 10, title));
  }
  assert.deepEqual(tasks, fixture());
});

check("Отсутствующая задача при изменении", () => {
  const tasks = fixture();
  expectFailure(setTaskCompleted(tasks, 777, true));
  expectFailure(renameTask(tasks, 777, "Название"));
  assert.deepEqual(tasks, fixture());
});

check("removeTask", () => {
  const tasks = fixture();
  const next = expectTasks(removeTask(tasks, 7));
  assert.deepEqual(next.map((task) => task.id), [1, 4, 10]);
  assert.notEqual(next, tasks);
  assert.deepEqual(tasks, fixture());
});

check("Удаление единственной задачи", () => {
  const tasks = [{ id: 1, title: "Задача", completed: false, priority: "low" }];
  const next = expectTasks(removeTask(tasks, 1));
  assert.deepEqual(next, []);
  assert.notEqual(next, tasks);
});

check("Некорректный id при удалении", () => {
  const tasks = fixture();
  for (const id of [...invalidIds, 777]) {
    expectFailure(removeTask(tasks, id));
  }
  assert.deepEqual(tasks, fixture());
});

check("Входные данные не изменяются", () => {
  const tasks = Object.freeze(fixture().map((task) => Object.freeze(task)));
  assert.equal(findTaskById(tasks, 4), tasks[1]);
  expectTasks(addTask(tasks, 20, "Новая задача"));
  expectTasks(setTaskCompleted(tasks, 4, true));
  expectTasks(renameTask(tasks, 10, "Новое название"));
  expectTasks(removeTask(tasks, 7));
  assert.deepEqual(tasks, fixture());
});

check("Общий сценарий", () => {
  const initial = fixture();
  let current = initial;
  current = expectTasks(addTask(current, 20, "Добавить проверку", "high"));
  assert.deepEqual(getTaskStats(current), { total: 5, completed: 2, pending: 3, progress: 40 });
  current = expectTasks(setTaskCompleted(current, 4, true));
  assert.deepEqual(getTaskStats(current), { total: 5, completed: 3, pending: 2, progress: 60 });
  current = expectTasks(renameTask(current, 10, "Подготовить инструкцию запуска"));
  current = expectTasks(removeTask(current, 7));
  assert.deepEqual(current.map((task) => task.id), [1, 4, 10, 20]);
  assert.deepEqual(initial, fixture());
});

check("Другой набор данных", () => {
  const tasks = [
    { id: 203, title: "Альфа", completed: false, priority: "low" },
    { id: 88, title: "Бета", completed: false, priority: "high" },
  ];
  const next = expectTasks(setTaskCompleted(tasks, 88, true));
  assert.deepEqual(getTaskStats(next), { total: 2, completed: 1, pending: 1, progress: 50 });
  assert.deepEqual(expectTasks(removeTask(next, 203)).map((task) => task.id), [88]);
});

console.log(`\nПроверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) {
  process.exitCode = 1;
}