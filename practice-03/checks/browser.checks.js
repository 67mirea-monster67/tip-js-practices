import { getVisibleTasks } from "../src/task-selectors.js";
import { createTaskElement, renderTaskList, renderSummary, renderEmptyState } from "../src/task-view.js";

const results = document.querySelector("#check-results");
const log = document.querySelector("#check-log");
const summary = document.querySelector("#check-summary");
const fixtureRoot = document.querySelector("#test-fixture");
const frame = document.querySelector("#test-frame");
let passed = 0;
let failed = 0;
let loadNumber = 0;
let appErrors = [];
const transcript = [];

function assert(condition, message = "Условие не выполнено") {
  if (!condition) throw new Error(message);
}
function same(actual, expected, message = "Результаты отличаются") {
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: получено ${JSON.stringify(actual)}, ожидалось ${JSON.stringify(expected)}`);
}
async function check(name, action) {
  fixtureRoot.replaceChildren();
  const item = document.createElement("li");
  try {
    await action();
    passed += 1;
    item.className = "check-pass";
    item.textContent = `OK: ${name}`;
  } catch (error) {
    failed += 1;
    item.className = "check-fail";
    item.textContent = `FAIL: ${name} — ${error.message}`;
  }
  results.append(item);
  transcript.push(item.textContent);
  log.textContent = transcript.join("\n");
}
function tasks() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}
function frozenTasks() {
  return Object.freeze(tasks().map((task) => Object.freeze(task)));
}
const ids = (items) => items.map((item) => item.id);
function element(tag = "div") {
  const node = document.createElement(tag);
  fixtureRoot.append(node);
  return node;
}
function summaryElement() {
  const root = element();
  for (const name of ["total", "completed", "pending", "progress", "visible"]) {
    const node = document.createElement("span");
    node.dataset.stat = name;
    root.append(node);
  }
  return root;
}
function readSummary(root) {
  return ["total", "completed", "pending", "progress", "visible"]
    .map((name) => root.querySelector(`[data-stat="${name}"]`)?.textContent.trim());
}
function requireNode(root, selector) {
  const node = root.querySelector(selector);
  assert(node, `Не найден элемент: ${selector}`);
  return node;
}
function click(root, selector) {
  requireNode(root, selector).click();
  assert(appErrors.length === 0, `Ошибка обработчика: ${appErrors.join("; ")}`);
}
function visibleIds(doc) {
  return [...doc.querySelectorAll("#task-list > [data-task-id]")]
    .map((node) => Number(node.dataset.taskId));
}
function stats(doc) {
  return readSummary(requireNode(doc, "#task-summary"));
}
function freshApp() {
  loadNumber += 1;
  appErrors = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      frame.removeEventListener("load", loaded);
      reject(new Error("Приложение не загрузилось за 10 секунд"));
    }, 10000);
    function loaded() {
      clearTimeout(timer);
      frame.removeEventListener("load", loaded);
      const doc = frame.contentDocument;
      if (!doc?.querySelector("#task-list")) {
        reject(new Error("В iframe не найдена страница приложения"));
        return;
      }
      frame.contentWindow.addEventListener("error", (event) => appErrors.push(event.message));
      resolve(doc);
    }
    frame.addEventListener("load", loaded);
    frame.src = `./index.html?check=${loadNumber}`;
  });
}
const row = (id) => `#task-list > [data-task-id="${id}"]`;
const action = (id, kind) => `${row(id)} button[data-action="${kind}"] .action-label`;
const filter = (mode) => `#task-filters button[data-filter="${mode}"] .filter-label`;

await check("Фильтр all возвращает новый массив в исходном порядке", () => {
  const input = frozenTasks();
  const result = getVisibleTasks(input, "all");
  same(ids(result), [1, 4, 7, 10]);
  assert(result !== input);
});
await check("Фильтр pending", () => {
  same(ids(getVisibleTasks(frozenTasks(), "pending")), [4, 7]);
});
await check("Фильтр completed", () => {
  same(ids(getVisibleTasks(frozenTasks(), "completed")), [1, 10]);
});
await check("Пустые фильтры", () => {
  for (const mode of ["all", "pending", "completed"]) same(getVisibleTasks([], mode), []);
});
await check("Карточка имеет правильную структуру", () => {
  const node = createTaskElement(tasks()[1]);
  assert(node instanceof HTMLLIElement);
  assert(node.classList.contains("task-card"));
  same(node.dataset.taskId, "4");
  same(requireNode(node, ".task-title").textContent, "Подготовить модель задач");
  same(requireNode(node, ".task-status").textContent, "В работе");
  same(requireNode(node, ".task-priority").textContent, "Высокий");
});
await check("Выполненная карточка", () => {
  const node = createTaskElement(tasks()[0]);
  assert(node.classList.contains("is-completed"));
  same(requireNode(node, ".task-status").textContent, "Выполнена");
  same(requireNode(node, '[data-action="toggle"]').getAttribute("aria-pressed"), "true");
});
await check("В карточке две кнопки", () => {
  const node = createTaskElement(tasks()[1]);
  same(node.querySelectorAll("button").length, 2);
  same(requireNode(node, '[data-action="toggle"] .action-label').textContent, "Выполнена");
  same(requireNode(node, '[data-action="delete"] .action-label').textContent, "Удалить");
});
await check("Название отображается текстом", () => {
  const title = '<strong>Проверка</strong> & "кавычки"';
  const node = createTaskElement({ ...tasks()[1], title });
  const heading = requireNode(node, ".task-title");
  same(heading.textContent, title);
  same(heading.children.length, 0);
});
await check("Повторный render не дублирует карточки", () => {
  const list = element("ul");
  renderTaskList(list, tasks());
  renderTaskList(list, tasks());
  same(list.children.length, 4);
});
await check("Пустой render очищает список", () => {
  const list = element("ul");
  renderTaskList(list, tasks());
  renderTaskList(list, []);
  same(list.children.length, 0);
});
await check("Сводка по полному списку", () => {
  const root = summaryElement();
  renderSummary(root, frozenTasks(), 2);
  same(readSummary(root), ["4", "2", "2", "50.0%", "2"]);
});
await check("Пустая сводка", () => {
  const root = summaryElement();
  renderSummary(root, [], 0);
  same(readSummary(root), ["0", "0", "0", "0.0%", "0"]);
});
await check("Пустой общий список", () => {
  const node = element("p");
  renderEmptyState(node, 0, 0);
  assert(!node.hidden);
  same(node.textContent, "Список задач пуст.");
});
await check("Пустой результат фильтра", () => {
  const node = element("p");
  renderEmptyState(node, 4, 0);
  assert(!node.hidden);
  same(node.textContent, "Нет задач по выбранному фильтру.");
});
await check("Приложение показывает исходный набор", async () => {
  const doc = await freshApp();
  same(visibleIds(doc), [1, 4, 7, 10]);
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});
await check("Фильтр работает через вложенный span", async () => {
  const doc = await freshApp();
  click(doc, filter("pending"));
  same(visibleIds(doc), [4, 7]);
  same(stats(doc), ["4", "2", "2", "50.0%", "2"]);
});
await check("Активный фильтр", async () => {
  const doc = await freshApp();
  click(doc, filter("completed"));
  const active = [...doc.querySelectorAll('#task-filters button[aria-pressed="true"]')];
  same(active.length, 1);
  same(active[0].dataset.filter, "completed");
  assert(active[0].classList.contains("is-active"));
});
await check("Фильтр не удаляет скрытые задачи", async () => {
  const doc = await freshApp();
  click(doc, filter("pending"));
  click(doc, filter("completed"));
  click(doc, filter("all"));
  same(visibleIds(doc), [1, 4, 7, 10]);
});
await check("Переключение статуса по id", async () => {
  const doc = await freshApp();
  click(doc, action(4, "toggle"));
  same(stats(doc), ["4", "3", "1", "75.0%", "4"]);
  click(doc, action(4, "toggle"));
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});
await check("Удаление меняет данные", async () => {
  const doc = await freshApp();
  click(doc, action(7, "delete"));
  same(visibleIds(doc), [1, 4, 10]);
  same(stats(doc), ["3", "2", "1", "66.7%", "3"]);
});
await check("Клик по названию ничего не меняет", async () => {
  const doc = await freshApp();
  click(doc, `${row(4)} .task-title`);
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});
await check("Одно нажатие после повторных фильтров", async () => {
  const doc = await freshApp();
  for (const mode of ["pending", "all", "completed", "all", "pending", "all"]) click(doc, filter(mode));
  click(doc, action(4, "toggle"));
  same(stats(doc), ["4", "3", "1", "75.0%", "4"]);
});
await check("Удаление всех записей и нулевая сводка", async () => {
  const doc = await freshApp();
  for (const id of [1, 4, 7, 10]) click(doc, action(id, "delete"));
  same(visibleIds(doc), []);
  same(stats(doc), ["0", "0", "0", "0.0%", "0"]);
  same(requireNode(doc, "#empty-message").textContent, "Список задач пуст.");
});
await check("Фильтр без совпадений", async () => {
  const doc = await freshApp();
  click(doc, action(4, "toggle"));
  click(doc, action(7, "toggle"));
  click(doc, filter("pending"));
  same(visibleIds(doc), []);
  same(stats(doc), ["4", "4", "0", "100.0%", "0"]);
  same(requireNode(doc, "#empty-message").textContent, "Нет задач по выбранному фильтру.");
});
await check("Неизвестный числовой id", async () => {
  const doc = await freshApp();
  const card = requireNode(doc, row(4));
  card.dataset.taskId = "777";
  click(card, '[data-action="delete"] .action-label');
  assert(requireNode(doc, "#operation-message").textContent.trim().length > 0);
  same(visibleIds(doc), [1, 4, 7, 10]);
});
await check("id 4abc не превращается в 4", async () => {
  const doc = await freshApp();
  const card = requireNode(doc, row(4));
  card.dataset.taskId = "4abc";
  click(card, '[data-action="toggle"] .action-label');
  assert(requireNode(doc, "#operation-message").textContent.trim().length > 0);
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});
await check("Неизвестное действие игнорируется", async () => {
  const doc = await freshApp();
  const button = requireNode(doc, `${row(4)} [data-action="toggle"]`);
  button.dataset.action = "archive";
  click(button, ".action-label");
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});
await check("Фокус после изменения", async () => {
  const doc = await freshApp();
  click(doc, action(4, "toggle"));
  same(doc.activeElement?.dataset.action, "toggle");
  same(doc.activeElement?.closest("[data-task-id]")?.dataset.taskId, "4");
  click(doc, filter("pending"));
  click(doc, action(7, "toggle"));
  same(doc.activeElement?.dataset.filter, "pending");
});
await check("После перезагрузки состояние сбрасывается", async () => {
  let doc = await freshApp();
  click(doc, action(7, "delete"));
  doc = await freshApp();
  same(visibleIds(doc), [1, 4, 7, 10]);
});
fixtureRoot.replaceChildren();
const conclusion = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
summary.textContent = conclusion;
log.textContent = `${transcript.join("\n")}\n\n${conclusion}`;
document.documentElement.dataset.checksDone = "true";
document.documentElement.dataset.checksPassed = String(passed);
document.documentElement.dataset.checksFailed = String(failed);
