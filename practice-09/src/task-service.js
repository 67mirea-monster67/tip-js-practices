export function selectTasks(tasks, filters) {
  const q = filters.q.toLocaleLowerCase('ru-RU');
  return tasks.filter(task =>
    (filters.completed === null || task.completed === filters.completed) &&
    (filters.priority === null || task.priority === filters.priority) &&
    (filters.categoryId === null || task.categoryId === filters.categoryId) &&
    task.title.toLocaleLowerCase('ru-RU').includes(q)
  ).map(task => ({ ...task }));
}
export function findTask(tasks, id) {
  return tasks.find(item => item.id === id) ?? null;
}
