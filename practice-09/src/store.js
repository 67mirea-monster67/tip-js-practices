import { categories as seedCategories, tasks as seedTasks } from './data.js';
import { selectTasks, findTask } from './task-service.js';
export function createStore() {
  const tasks = seedTasks.map(task => ({ ...task }));
  const categories = seedCategories.map(category => ({ ...category }));
  let nextId = Math.max(...tasks.map(task => task.id)) + 1;
  return {
    listTasks: filters => selectTasks(tasks, filters),
    getTask: id => {
      const task = findTask(tasks, id);
      return task ? { ...task } : null;
    },
    listCategories: () => categories.map(category => ({ ...category })),
    addTask(value) {
      const task = { ...value, id: nextId++, completed: false };
      tasks.push(task);
      return { ...task };
    },
  };
}
