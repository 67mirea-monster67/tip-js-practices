"use strict";

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

let inputError = false;

if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
  console.log("Ошибка: значения количества задач должны быть конечными числами.");
  inputError = true;
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
  inputError = true;
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным.");
  inputError = true;
} else if (totalTasks > 1000 || completedTasks > 1000) {
  console.log("Ошибка: количество задач не должно превышать 1000.");
  inputError = true;
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует.");
  inputError = true;
}

if (!Number.isFinite(dailyLimit) || !Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть целым числом от 1 до 1000.");
  inputError = true;
}

if (!inputError) {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  if (remainingTasks === 0) {
    if (totalTasks === 0) {
      console.log("Задач пока нет");
    } else {
      console.log("Все задачи уже выполнены");
    }
    console.log("Потребуется дней: 0");
  } else {
    console.log(`Осталось задач: ${remainingTasks}`);

    while (remainingTasks > 0) {
      day += 1;
      const todayTasks = Math.min(dailyLimit, remainingTasks);
      remainingTasks -= todayTasks;
      console.log(`День ${day}: выполнено ${todayTasks}, осталось ${remainingTasks}`);
    }

    console.log(`Потребуется дней: ${day}`);
  }
}