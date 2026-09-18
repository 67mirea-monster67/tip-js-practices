"use strict";

const totalTasks = 12;
const completedTasks = 5;

if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
  console.log("Ошибка: значения должны быть конечными числами.");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным.");
} else if (totalTasks > 1000 || completedTasks > 1000) {
  console.log("Ошибка: количество задач не должно превышать 1000.");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует.");
} else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const progressPercent = (completedTasks / totalTasks) * 100;
  let status;

  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks < totalTasks) {
    status = "В работе";
  } else {
    status = "Завершено";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${progressPercent.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}