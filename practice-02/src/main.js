import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
import { searchTasks } from "./task-extra.js";

function showStats(tasks, title) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`\n${title}`);
  console.log(`Всего: ${total}`);
  console.log(`Выполнено: ${completed}`);
  console.log(`Осталось: ${pending}`);
  console.log(`Прогресс: ${total === 0 ? "Задач пока нет" : `${progress.toFixed(1)}%`}`);
}

function applyResult(current, result) {
  if (result.ok) {
    return result.tasks;
  }

  console.log(`Ошибка: ${result.error}`);
  return current;
}

console.log("ПР2. Работа с функциями, объектами и массивами");
console.log("Номер варианта:", variantNumber);

console.log("\nИсходные задачи:");
console.table(demoTasks);
console.log("Названия:", getTaskTitles(demoTasks));
console.log("Невыполненные:", getPendingTasks(demoTasks));
showStats(demoTasks, "Исходная сводка");

let currentTasks = demoTasks;

currentTasks = applyResult(
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high")
);
showStats(currentTasks, "После добавления id 20");

currentTasks = applyResult(
  currentTasks,
  setTaskCompleted(currentTasks, 4, true)
);
showStats(currentTasks, "После выполнения id 4");

currentTasks = applyResult(
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска")
);
showStats(currentTasks, "После переименования id 10");

currentTasks = applyResult(
  currentTasks,
  removeTask(currentTasks, 7)
);
showStats(currentTasks, "После удаления id 7");

const duplicateResult = addTask(currentTasks, 20, "Дубликат", "medium");
if (!duplicateResult.ok) {
  console.log(`Ошибка при повторном добавлении: ${duplicateResult.error}`);
}

console.log("\nИтоговые задачи:");
console.table(currentTasks);
console.log("Идентификаторы:", currentTasks.map((task) => task.id));
console.log("demoTasks после всех операций:");
console.table(demoTasks);

console.log("\nИндивидуальный вариант:");
console.table(variantTasks);
showStats(variantTasks, "Начальная сводка варианта");

let currentVariantTasks = variantTasks;

currentVariantTasks = applyResult(
  currentVariantTasks,
  addTask(currentVariantTasks, 80, "Начать разработку", "high")
);
currentVariantTasks = applyResult(
  currentVariantTasks,
  setTaskCompleted(currentVariantTasks, 11, true)
);
currentVariantTasks = applyResult(
  currentVariantTasks,
  renameTask(currentVariantTasks, 23, "Составить подробный план проекта")
);
currentVariantTasks = applyResult(
  currentVariantTasks,
  removeTask(currentVariantTasks, 37)
);

const duplicateVariant = addTask(
  currentVariantTasks,
  80,
  "Повторная задача",
  "high"
);

if (!duplicateVariant.ok) {
  console.log(`Ошибка варианта: ${duplicateVariant.error}`);
}

console.table(currentVariantTasks);
showStats(currentVariantTasks, "Итоговая сводка варианта");

console.log("\nПоиск по части названия:");
console.log(searchTasks(currentTasks, " ПРОВЕР "));
console.log("Исходный массив demoTasks не изменился:", JSON.stringify(demoTasks));
console.log("Исходный массив variantTasks не изменился:", JSON.stringify(variantTasks));
